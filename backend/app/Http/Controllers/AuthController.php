<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request) {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) return response()->json(['message' => 'Invalid credentials.'], 422);
        return response()->json(['token' => $user->createToken('mobile-demo')->plainTextToken, 'user' => $user]);
    }

    public function register(Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ]);
        // Note: User model casts 'password' => 'hashed', so we pass plain text
        // and let the model hash it. Calling Hash::make() here would double-hash.
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);
        return response()->json([
            'token' => $user->createToken('mobile-demo')->plainTextToken,
            'user' => $user
        ], 201);
    }
}

