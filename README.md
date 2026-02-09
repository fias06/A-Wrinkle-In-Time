#A Wrinkle In Time

A voice-first social platform that enables accessible connection and play without relying on a keyboard or mouse.

A Wrinkle In Time is designed for seniors and motor-impaired users, allowing them to navigate, socialize, and play games using only their voice.

🧩 Overview

Modern digital platforms assume fine motor control, keyboards, and mice — creating barriers for many users.
A Wrinkle In Time explores a different approach: voice as the primary interface.

The platform combines conversational AI, real-time audio feedback, and voice-controlled games to create an accessible and engaging social experience.

✨ Core Features
🎙️ Voice-Only Navigation

Entire website can be controlled via voice commands

No typing, clicking, or traditional inputs required

AI agent provides spoken guidance and feedback throughout the experience

👤 Voice-Based Onboarding & Profiles

Users create accounts and describe interests verbally

Avatar creation is voice-driven

Profile photos support visual filters for personalization

🤝 Smart Social Matching

Users are matched with others who share similar interests and language

Designed to encourage meaningful, low-friction connections

🎮 Voice-Controlled Games

Three cooperative multiplayer games built with Phaser.js

All gameplay actions mapped to voice commands

Designed to be simple, social, and accessible

🎵 Dynamic Audio Experience

Background music and sound effects generated with ElevenLabs

Music adapts to user preferences and context

Audio plays a central role in immersion and usability

🛠️ Technical Architecture

Frontend: React

Games: Phaser.js (JavaScript)

Backend: Node.js

Voice & Audio: ElevenLabs APIs

Conversational AI for intent detection and UI control

Music & sound effects generation for personalization

Custom client-side logic translates spoken intent into:

UI navigation events

Game inputs

Audio responses

🚧 Challenges & Solutions

Latency & Real-Time Sync
Coordinating voice recognition, intent processing, and multiplayer game state required careful handling to maintain responsiveness.

Audio Prompt Quality
Simple user inputs were insufficient for high-quality audio generation, so a translation layer was implemented to expand casual preferences into detailed prompts.

🏆 Highlights

Complete user flow accessible without keyboard or mouse

Three original multiplayer games built from scratch

Voice used as the primary interaction model, not an add-on

Accessibility-driven design that improves overall UX

📚 What We Learned

Designing for accessibility forces better abstractions. Removing traditional inputs led to a cleaner interface and deeper focus on intent-based interaction.

We also gained hands-on experience with conversational design — understanding how users speak naturally and how AI should respond in social contexts.

🔮 Future Work

Tablet support (commonly used by seniors)

Additional voice-controlled games

Expanded personalization and matching logic

🧰 Tech Stack

JavaScript

Node.js

React

Phaser.js

ElevenLabs APIs

🔗 Links

Devpost: https://devpost.com/software/a-wrinkle-in-time
