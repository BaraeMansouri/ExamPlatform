<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Exemple :
        // 'App\Events\SessionAccepted' => [
        //     'App\Listeners\NotifyStudent',
        // ],
    ];

    public function boot(): void
    {
        parent::boot();
    }
}
