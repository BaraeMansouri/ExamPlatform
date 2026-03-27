<?php

namespace Database\Seeders;

use App\Models\Professor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $professor = Professor::updateOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test Professor',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $this->call([
            StudentGroupSeeder::class,
            ModuleSeeder::class,
        ]);
    }
}
