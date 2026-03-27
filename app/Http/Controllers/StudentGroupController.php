<?php

namespace App\Http\Controllers;

use App\Models\StudentGroup;

class StudentGroupController extends Controller
{
    public function index()
    {
        return StudentGroup::all();
    }
}
