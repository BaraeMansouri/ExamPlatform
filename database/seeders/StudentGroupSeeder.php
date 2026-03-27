<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StudentGroup;

class StudentGroupSeeder extends Seeder
{
    public function run(): void
    {
        StudentGroup::create(['name' => 'Groupe A']);
        StudentGroup::create(['name' => 'Groupe B']);
        StudentGroup::create(['name' => 'Groupe C']);
    }
}
