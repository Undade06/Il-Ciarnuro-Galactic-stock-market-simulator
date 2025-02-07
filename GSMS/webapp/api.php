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
            $ret = ["error" => 1, "msg" => "Connection error"];
        }
        if(!isset($_GET["op"])){
            $ret=["error"=>1, "msg"=>"Operation not set"];
        }else{
            switch($_GET["op"]){
                case "login":{
                    if(isset($_POST["username"]) && isset($_POST["password"])){
                        $username = $_POST["username"];
                        $password = sha1($_POST["password"]);
                        $q = $conn->prepare("SELECT passwordHash from Player WHERE username = ? AND passwordHash = ?");
                        $q->bind_param("ss", $username, $password);
                        $q->execute();
                        $result = $q->get_result();
                        if($result->num_rows > 0) {
                            $row = $result->fetch_assoc();
                            $_SESSION["user_id"] = $row["username"];
                            $ret = ["error" => 0, "msg" => "Logged in successfully"];
                        } else {
                            $ret = ["error" => 1, "msg" => "Incorrect username or password"];
                        }
                    }
                } break;
                case "register":{
                    if(isset($_POST["username"]) && isset($_POST["password"]) && isset($_POST["email"])){
                        $username = $_POST["username"];
                        $password = sha1($_POST["password"]);
                        $email = $_POST["email"];
                        $q = $conn->prepare("SELECT username from Player WHERE username = ?");
                        $q->bind_param("s", $_POST["username"]);
                        $q->execute();
                        $result = $q->get_result();
                        if($result->num_rows > 0) {
                            $ret = ["error" => 1, "msg" => "Username already exist"];
                            break;
                        }
                        $q = $conn->prepare("INSERT INTO Player (username, passwordHash, email) VALUES (?, ?, ?)");
                        $q->bind_param("sss", $_POST["username"], $password, $_POST["email"]);
                        $q->execute();
                        $ret = ["error" => 0, "msg" => "Registered successfully"];
                    } else {
                        $ret = ["error" => 1, "msg" => "Missing field/s"];
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