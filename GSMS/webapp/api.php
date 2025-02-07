<?php
    include "doNotCache.php";
    include "_db.php";

    session_start();

    if (!isset($_SESSION["user_id"])) {
        $_SESSION["user_id"] = "";
    }

    try{
        $conn = new mysqli($db_hostname, $db_username, $db_password, $db_name);
        if ($conn->connect_error) {
            sendJSON(["error" => 1, "message" => "Errore di connessione al database"]);
        }
        if(!isset($_GET["op"])){
            $ret=["error"=>1, "msg"=>"Operation not set"];
        }else{
            switch($_GET["op"]){
                case "login":{
                    $ret=["error"=>0, "msg"=>"User correctly logged in"];
                } break;
                case "register":{
                    if(isset($_POST["username"]) && isset($_POST["password"]) && isset($_POST["email"])){
                        $username = $_POST["username"];
                        $password = $_POST["password"];
                        $email = $_POST["email"];
                        $q = $conn->prepare("SELECT username from Player WHERE username = ?");
                        $q->bind_param("s", $_POST["username"]);
                        $q->execute();
                        $result = $q->get_result();
                        if($result->num_rows > 0) {
                            $ret = ["error" => 1, "msg" => "Username already exist"];
                            break;
                        }
                        $q = $conn->prepare("INSERT INTO Player (username, password, email) VALUES (?, ?, ?)");
                        $q->bind_param("sss", $_POST["username"], $passwordHash, $_POST["email"]);
                        $q->execute();
                        $ret = ["error" => 0, "msg" => "Registered successfully"];
                    } else {
                        $ret = ["error" => 1, "msg" => "Missing fields"];
                        break;
                    }
                } break;
                default:{
                    $ret=["error"=>1, "msg"=>"Undefined operation"];
                } 
                break;
            }
        }
    }catch(Exception $e){
        $ret=["error"=>1, "msg"=>"Error: ".$e->getMessage()];
    }
    echo json_encode($ret);
    
?>