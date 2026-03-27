<?php

namespace App\Services;

class SuspicionCalculator
{
    public function calculate(int $dangerEvents, int $warningEvents): string
    {
        $score = ($dangerEvents * 3) + ($warningEvents * 1);

        if ($score === 0) {
            return 'low';
        } elseif ($score >= 1 && $score <= 3) {
            return 'medium';
        } elseif ($score >= 4 && $score <= 7) {
            return 'high';
        } else {
            return 'critical';
        }
    }

    public static function calculateLevel(int $dangerEvents, int $warningEvents): string
    {
        return app(self::class)->calculate($dangerEvents, $warningEvents);
    }
}
