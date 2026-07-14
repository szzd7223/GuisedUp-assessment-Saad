<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'text', 'image_url', 'embedding', 'authenticity_score'];

    protected $appends = ['time_ago', 'formatted_date'];

    protected $casts = ['created_at' => 'datetime', 'updated_at' => 'datetime'];

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function interactions(): HasMany { return $this->hasMany(Interaction::class); }
    public function getTimeAgoAttribute(): string { return $this->created_at?->diffForHumans() ?? 'just now'; }
    public function getFormattedDateAttribute(): string { return $this->created_at?->format('M j, Y · g:i A') ?? ''; }
}
