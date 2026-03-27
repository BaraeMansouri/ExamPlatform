<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Les URI qui doivent être exclues de la vérification CSRF.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',   // ✅ toutes les routes API exemptées
    ];
}
