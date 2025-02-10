<?php
    include "doNotCache.php";
    include "_db.php";

    session_start();

    if (!isset($_SESSION["user_id"])) {
        $_SESSION["user_id"] = "";
        $_SESSION["status"] = "";
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
                        $ret = ["error" => 0, "msg" => "Connected"];
                    }else{
                        $ret = ["error" => 1, "msg" => "Not connected"];
                    }
                } break;
                case "login":{
                    if(isset($_POST["username"]) && isset($_POST["password"])){ 
                        $username = $_POST["username"];
                        $password = sha1($_POST["password"]);
                        $q = $conn->prepare("SELECT passwordHash from player WHERE username = ? AND passwordHash = ?");
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
                        $password = sha1($_POST["password"]);
                        $email = $_POST["email"];
                        $q = $conn->prepare("SELECT username from player WHERE username = ?");
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
                    setcookie("PHPSESSID", "",0, "/");
                    $ret = ["error" => 0, "msg" => "Logged out successfully"];
                } break;
                case "createSave":{
                    if(isset($_SESSION["user_id"]) && isset($_POST["saveSeeds"]) && isset($_POST["idSave"]) && isset($_POST["ownedStocks"]) && isset($_POST["lastAccess"]) && isset($_POST["budget"])){
                        $saveS = $_POST["saveSeeds"];
                        $idSave = $_POST["idSave"];
                        $ownS = $_POST["ownedStocks"];
                        $lastA = $_POST["lastAccess"];
                        $budget = $_POST["budget"];
                    }else{
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
                        break;
                    }
                    $q = $conn->prepare("INSERT INTO save (idPlayer, idSave, budget, lastAccess, saveSeeds, ownedStocks) 
                                        VALUES ((select id from player where username = ?), ?, ?, ?, ?, ?)");
                    $q->bind_param("sidsss", $_SESSION["user_id"], $idSave, $budget, $lastA, $saveS, $ownS);
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
                    $q = $conn->prepare("DELETE FROM Save WHERE idSave = ? AND idPlayer = (select id from Player where username = ?)");
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

                    $q = $conn->query("SELECT * FROM Save WHERE idPlayer = (SELECT id FROM Player WHERE username = \"".$_SESSION["user_id"]."\")");
                    
                    $saves=[];
                    while($save=$q->fetch_array()){
                        $tempS=["idSave"=>$save["idSave"], "budget"=>$save["budget"], "lastAccess"=>$save["lastAccess"], "ownedStocks"=>$save["ownedStocks"], "saveSeeds"=>$save["saveSeeds"]];
                        array_push($saves, $tempS);
                    }

                    $q->close();
                    $ret = ["error" => 0, "saves"=>$saves];
                } break;
                default:{
                    $ret=["error"=>1, "msg"=>"Undefined operation"];
                } break;
            }
        }
    }catch(Exception $e){
        $ret=["error"=>1, "msg"=>"Error: ".$e->getMessage()];
    }

    echo json_encode($ret);
    
?>