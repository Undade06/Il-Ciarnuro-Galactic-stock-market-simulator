<?php
    include 'doNotCache.php';

    session_start();

    include '_db.php';

    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        sendJSON(["error" => 1, "message" => "Player not logged in"]);
        exit();
    }
    
?>