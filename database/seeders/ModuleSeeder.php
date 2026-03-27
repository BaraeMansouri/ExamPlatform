<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Module;
use App\Models\Professor;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $professor = Professor::first();

        if (! $professor) {
            return;
        }

        $modules = [
            ['name' => 'Mathématiques', 'code' => 'MATH-101'],
            ['name' => 'Physique', 'code' => 'PHYS-101'],
            ['name' => 'Informatique', 'code' => 'INFO-101'],
        ];

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['code' => $module['code']],
                [...$module, 'professor_id' => $professor->id]
            );
        }
    }
}
