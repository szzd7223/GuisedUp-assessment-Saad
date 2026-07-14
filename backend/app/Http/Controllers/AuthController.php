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
}
