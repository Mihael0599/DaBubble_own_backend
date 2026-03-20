# 💬 DaBubble

DaBubble is a modern team communication and collaboration platform built with Angular. This chat application allows teams to communicate through channels, direct messages, and threaded conversations, similar to popular workplace messaging tools.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.3.

## ✨ Features

### 🎯 Core Functionality
- **Channel Communication**: Create and join themed channels for organized team discussions
- **Direct Messages**: Send private messages between team members
- **Thread Conversations**: Reply to messages in organized threads
- **Real-time Messaging**: Live chat functionality with instant message delivery
- **User Management**: User authentication, profiles, and online status tracking

### 🎨 User Interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Emoji Support**: Rich emoji picker for expressive communication
- **File Sharing**: Support for image and file attachments
- **User Mentions**: Tag team members with @ mentions
- **Channel Mentions**: Reference channels with # mentions

### 🚀 User Experience
- **User Profiles**: Customizable avatars and profile information
- **Online Status**: See who's active or away
- **Message Reactions**: React to messages with emojis
- **Message Editing**: Edit and delete your own messages
- **Search Functionality**: Find messages, users, and channels

## 📁 Project Structure

```
src/
├── app/
│   ├── main-content/           # Main application components
│   │   ├── channel-section/    # Channel management and display
│   │   ├── chat-section/       # Message display and chat interface
│   │   ├── input-message/      # Message composition
│   │   ├── thread-section/     # Threaded conversations
│   │   ├── user-card/          # User profile displays
│   │   └── work-space-section/ # Sidebar navigation
│   ├── services/               # Business logic and data services
│   ├── shared/                 # Reusable components
│   ├── guards/                 # Route protection
│   └── models/                 # TypeScript models and classes
└── assets/                     # Static resources (images, fonts, icons)
```

## 🚀 Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## 🛠️ Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## 📦 Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## 🛠️ Technologies Used

- **Angular 19**: Progressive web app framework
- **TypeScript**: Type-safe JavaScript development
- **Angular Material**: UI component library
- **Firebase**: Backend services and real-time database
- **SCSS**: Enhanced CSS with variables and mixins
- **RxJS**: Reactive programming with observables

## 🧩 Key Components

- **ChannelSectionComponent**: Manages channel creation, editing, and information
- **ChatSectionComponent**: Handles message display and chat functionality
- **InputMessageComponent**: Message composition with emoji and mention support
- **ThreadSectionComponent**: Manages threaded conversation views
- **WorkSpaceSectionComponent**: Navigation sidebar with channels and direct messages
- **UserCardComponent**: User profile display and management

## 🔧 Services

- **ChannelService**: Channel management and operations
- **ChatService**: Message handling and real-time communication
- **UserService**: User authentication and profile management
- **NavigationService**: Application routing and navigation

## 🧪 Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## 🔍 Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 📚 Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## 📄 License

This project is part of a coding bootcamp exercise and is intended for educational purposes.