<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionRejected implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public $sessionId;

    public function __construct($sessionId)
    {
        $this->sessionId = $sessionId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('private-session.' . $this->sessionId);
    }

    public function broadcastAs()
    {
        return 'session.rejected';
    }
}
