<?php
    include "doNotCache.php";
    include "_db.php";

    session_start();

    $maxMinuteDelay = 5;        // Minutes of not updating for a save to be considered available
    $maxTokenHours = 24;        // Hours of validity of a token

    if (!isset($_SESSION["user_id"])) {
        $_SESSION["user_id"] = "";
        $_SESSION["status"] = "";
        $_SESSION["lastSave"] = "";
        $_SESSION["token"] = "";
    }

    try{
        $conn = new mysqli($db_hostname, $db_username, $db_password, $db_name);
        if ($conn->connect_error) {
            $ret = ["error" => 1, "msg" => "Connection error"];
        }
        if(!isset($_GET["op"])){
            $ret=["error"=>1, "msg"=>"Operation not set"];
        }else{
            switch($_GET["op"]){
                case "checkLoggedIn":{
                    if($_SESSION["user_id"] != ""){
                        $ret = ["error" => 0, "msg" => "Connected", "username"=>$_SESSION["user_id"]];
                    }else{
                        $ret = ["error" => 1, "msg" => "Not connected"];
                    }
                } break;
                case "login":{
                    if(isset($_POST["username"]) && isset($_POST["password"])){ 
                        $username = $_POST["username"];
                        $password = hash("sha256", $_POST["password"]);
                        $q = $conn->prepare("SELECT passwordHash FROM player WHERE username = ? AND passwordHash = ?");
                        $q->bind_param("ss", $username, $password);
                        $q->execute();
                        $result = $q->get_result();
                        if($result->num_rows > 0) {
                            $_SESSION["user_id"] = $username;
                            $ret = ["error" => 0, "msg" => "Logged in successfully", "status" => "saves"];
                        } else {
                            $ret = ["error" => 1, "msg" => "Incorrect username or password"];
                        }
                        $result->close();
                    }
                } break;
                case "register":{
                    if(isset($_POST["username"]) && isset($_POST["password"]) && isset($_POST["email"])){
                        $username = $_POST["username"];
                        $password = hash("sha256", $_POST["password"]);
                        $email = $_POST["email"];
                        $q = $conn->prepare("SELECT username FROM player WHERE username = ?");
                        $q->bind_param("s", $_POST["username"]);
                        $q->execute();
                        $result = $q->get_result();
                        if($result->num_rows > 0) {
                            $ret = ["error" => 1, "msg" => "Username already exists"];
                            break;
                        }
                        $q = $conn->prepare("INSERT INTO player (username, passwordHash, email) VALUES (?, ?, ?)");
                        $q->bind_param("sss", $_POST["username"], $password, $_POST["email"]);
                        $q->execute();
                        $ret = ["error" => 0, "msg" => "Registered successfully"];
                        $q->close();
                        $_SESSION["user_id"] = $username;
                    } else {
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
                        break;
                    }
                } break;
                case "logout":{
                    session_unset();
                    setcookie("PHPSESSID", "", 0, "/");
                    // workaround to let the save be available
                    $q = $conn->prepare("UPDATE save SET realLastAccess = DATE_ADD(NOW(), INTERVAL -? -1 MINUTE) WHERE idPlayer = (SELECT id FROM player WHERE username = ?) AND idSave = ?");
                    $q->bind_param("isi", $maxMinuteDelay, $_SESSION["user_id"], $_GET["idSave"]);
                    $q->execute();
                    $q->close();
                    $ret = ["error" => 0, "msg" => "Logged out successfully"];
                } break;
                case "createSave":{
                    if(isset($_SESSION["user_id"]) && isset($_POST["saveSeeds"]) && isset($_POST["idSave"]) && isset($_POST["ownedStocks"]) && isset($_POST["lastAccess"]) && isset($_POST["budget"]) && isset($_POST["realStartDate"])){
                        $saveS = $_POST["saveSeeds"];
                        $idSave = $_POST["idSave"];
                        $ownS = $_POST["ownedStocks"];
                        $lastA = $_POST["lastAccess"];
                        $budget = $_POST["budget"];
                        $rsd = $_POST["realStartDate"];
                    }else{
                        $ret = ["error" => 1, "msg" => "Missing field/s or not logged in"];
                        break;
                    }
                    $q = $conn->prepare("INSERT INTO save (idPlayer, idSave, budget, lastAccess, saveSeeds, ownedStocks, realStartDate, realLastAccess) 
                                        VALUES ((SELECT id FROM player WHERE username = ?), ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL -? * 2 MINUTE))");   // just to be sure
                    $q->bind_param("sidssssi", $_SESSION["user_id"], $idSave, $budget, $lastA, $saveS, $ownS, $rsd, $maxMinuteDelay);
                    $q->execute();
                    $ret = ["error" => 0, "msg" => "Save created successfully"];
                    $q->close();
                } break;
                case "deleteSave":{
                    if(isset($_SESSION["user_id"]) && isset($_GET["save"])){
                        $idSave = $_GET["save"];
                    }else{
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
                        break;
                    }
                    $q = $conn->prepare("DELETE FROM save WHERE idSave = ? AND idPlayer = (SELECT id FROM player WHERE username = ?)");
                    $q->bind_param("ss", $idSave, $_SESSION["user_id"]);
                    $q->execute();
                    $ret = ["error" => 0, "msg" => "Save deleted successfully"];
                    $q->close();
                } break;
                case "getSaves":{
                    if(!isset($_SESSION["user_id"])){    
                        $ret = ["error" => 1, "msg" => "Not logged in"];
                        break;
                    }

                    $q = $conn->prepare("SELECT * FROM save WHERE idPlayer = (SELECT id FROM player WHERE username = ?)");
                    $q->bind_param("s", $_SESSION["user_id"]);
                    $q->execute();
                    $q = $q->get_result();
                    
                    $saves=[];
                    while($save=$q->fetch_array()){
                        $now = new DateTime();
                        $lastAccess = new DateTime($save["realLastAccess"]);
                        if($now->getTimestamp() - $lastAccess->getTimestamp() > $maxMinuteDelay * 60 || $_SESSION["lastSave"] == $save["idSave"]){
                            $save["used"] = 0;
                        }else{
                            $save["used"] = 1;
                        }
                        $tempS=["idSave"=>$save["idSave"], "budget"=>$save["budget"], "lastAccess"=>$save["lastAccess"], "ownedStocks"=>$save["ownedStocks"], "saveSeeds"=>$save["saveSeeds"], "realStartDate"=>$save["realStartDate"], "used"=>$save["used"]];
                        array_push($saves, $tempS);
                    }

                    $q->close();
                    $ret = ["error" => 0, "saves"=>$saves];
                } break;
                case "updateSave":{
                    if(!isset($_SESSION["user_id"])){    
                        $ret = ["error" => 1, "msg" => "Not logged in"];
                        break;
                    }
                    
                    if(!isset($_POST["ownedStocks"]) || !isset($_POST["lastAccess"]) || !isset($_POST["budget"]) || !isset($_POST["idSave"])){
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
                        break;
                    }
                    $ownS = $_POST["ownedStocks"];
                    $lastA = $_POST["lastAccess"];
                    $budget = $_POST["budget"];
                    $idSave = $_POST["idSave"];

                    $q = $conn->prepare("UPDATE save SET budget = ?, lastAccess = ?, ownedStocks = ? WHERE idPlayer = (SELECT id FROM player WHERE username = ?) AND idSave = ?");
                    
                    $q->bind_param("dsssi", $budget, $lastA, $ownS, $_SESSION["user_id"], $idSave);
                    $q->execute();

                    $ret = ["error" => 0, "msg" => "Save updated successfully"];
                    $q->close();
                } break;
                case "updateStatus":{

                    if(!isset($_SESSION["user_id"]) || $_SESSION["user_id"] === ""){    
                        $ret = ["error" => 1, "msg" => "Not logged in"];
                        break;
                    }

                    if(!isset($_POST["status"]) || !isset($_POST["saveSelected"])){
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
                        break;
                    }

                    $_SESSION["status"] = $_POST["status"];
                    $_SESSION["lastSave"] = $_POST["saveSelected"];
                    
                    $now = date("Y-m-d H:i:s");
                    $q = $conn->prepare("UPDATE save SET realLastAccess = ? WHERE idPlayer = (SELECT id FROM player WHERE username = ?) AND idSave = ?");
                    $q->bind_param("ssi", $now, $_SESSION["user_id"], $_SESSION["lastSave"]);
                    $q->execute();
                    $q->close();

                    $ret=["error" => 0, "msg" => "Status updated successfully"];
                } break;
                case "getStatus":{

                    if(!isset($_SESSION["user_id"])){    
                        $ret = ["error" => 1, "msg" => "Not logged in"];
                        break;
                    }

                    if(!isset($_SESSION["status"]) || !isset($_SESSION["lastSave"])){
                        $ret = ["error" => 1, "msg" => "Status not set"];
                        break;
                    }

                    $ret=["error" => 0, "msg" => "Got status successfully", "status" => $_SESSION["status"], "saveSelected" => $_SESSION["lastSave"]];
                } break;
                case "requestToken":{

                    if(!isset($_GET["username"])){
                        $ret = ["error" => 1, "msg" => "Username not valid"];
                        break;
                    }

                    $q = $conn->prepare("SELECT email FROM player WHERE username = ?");
                    $q->bind_param("s", $_GET["username"]);
                    $q->execute();
                    $result = $q->get_result();
                    if($result->num_rows < 1) {
                        $ret = ["error" => 1, "msg" => "Username not found"];
                        break;
                    }
                    while($r=$result->fetch_array()){
                        $email = $r["email"];
                    }

                    $token = bin2hex(random_bytes(16));
                    $expires = new DateTime();
                    $expires->modify('+'.$maxTokenHours.' hours');

                    $q=$conn->query("UPDATE player SET token = '".$token."', tokenExpires = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE email = '".$email."'");

                    $to = $email;
                    $subject = "Il Ciarnuro: GSMS - Reimposta password";
                    $txt = "In questa email troverai un token da inserire nel riquadro apposito per procedere al cambiamento della password.\n
                    Il token è valido per un singolo cambio di password fino a data(anno-mese-giorno) ".$expires->format('Y-m-d')." alle ore ".$expires->format('H:i')."\n
                    \nNon condividere con nessuno il seguente codice:
                    \nToken:\t".$token."
                    \n\nQuesto messaggio è stato inviato automaticamente, per favore non rispondere.";
                    $headers = "From: gcf5ia.lupopasinigames.com";

                    $r = mail($to, $subject, $txt, $headers);
                    $rr = 0;
                    if(!$r){
                        $rr = 1; 
                    }

                    $ret = ["error" => $rr, "msg" => "Email sent"];

                } break;
                case "verifyToken":{

                    if(!isset($_POST["token"])){
                        $ret = ["error" => 1, "msg" => "Token not valid"];
                        break;
                    }

                    $q = $conn->prepare("SELECT * FROM player WHERE token = ? AND tokenExpires > NOW()");
                    $q->bind_param("s", $_POST["token"]);
                    $q->execute();
                    $result = $q->get_result();
                    if($result->num_rows > 0) {
                        $ret = ["error" => 0, "msg" => "The token is valid"];
                        $_SESSION["token"] = $_POST["token"];
                    }else{
                        $ret = ["error" => 1, "msg" => "Token not found or expired"];
                    }
                    $q->close();

                } break;
                case "changePassword":{

                    if(!isset($_POST["password"])){
                        $ret = ["error" => 1, "msg" => "Password not valid"];
                        break;
                    }

                    if(!isset($_SESSION["token"]) || $_SESSION["token"] === ""){            // isset() func is pretty unreliable
                        $ret = ["error" => 1, "msg" => "Invalid token"];
                        break;
                    }

                    $password = hash("sha256", $_POST["password"]);

                    $q = $conn->prepare("UPDATE player SET passwordHash = ?, token = NULL, tokenExpires = NULL WHERE token = ?");
                    $q->bind_param("ss", $password, $_SESSION["token"]);
                    $q->execute();
                    $q->close();
                    $_SESSION["token"] = "";

                    $ret = ["error" => 0, "msg" => "Password changed successfully"];
                } break;
                default:{
                    $ret=["error" => 1, "msg" => "Undefined operation"];
                } break;
            }
        }
    }catch(Exception $e){
        $ret=["error" => 1, "msg" => "Error: ".$e->getMessage()];
    }

    echo json_encode($ret);
    
?>