<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\Professor;
use App\Models\Module;

class ProfessorAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::guard('web')->attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::guard('web')->user();

        // ✅ créer token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:professors',
            'password' => 'required|min:6'
        ]);

        $user = Professor::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $defaultModules = [
            ['name' => 'Mathématiques', 'code' => 'MATH'],
            ['name' => 'Physique', 'code' => 'PHYS'],
            ['name' => 'Informatique', 'code' => 'INFO'],
        ];

        foreach ($defaultModules as $module) {
            Module::create([
                'name' => $module['name'],
                'code' => $module['code'].'-'.$user->id,
                'professor_id' => $user->id,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out'
        ]);
    }
}
