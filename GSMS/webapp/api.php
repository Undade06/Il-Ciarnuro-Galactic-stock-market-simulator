<?php
    include "doNotCache.php";
    include "_db.php";

    session_start();

    if (!isset($_SESSION["user_id"])) {
        $_SESSION["user_id"] = "";
    }

    if(!isset($_GET["op"])){
        $ret=["error"=>1, "msg"=>"Operation not set"];
    }else{
        switch($_GET["op"]){
            case "login":{
                $ret=["error"=>0, "msg"=>"User correctly logged in"];
            }
            default:{
                $ret=["error"=>1, "msg"=>"Undefined operation"];
            } break;
        }
    }

    echo json_encode($ret);
    
?>