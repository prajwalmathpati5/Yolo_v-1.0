# YOLO Needs - A Firebase Studio Project

This is a Next.js starter project built in Firebase Studio. It's designed to help you quickly build applications that need to connect users with service providers or AI-driven solutions.

## Getting Started

To get this application running on your local machine using Visual Studio Code, follow these steps.

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 20 or later recommended)
*   [Visual Studio Code](https://code.visualstudio.com/)

### 1. Install Dependencies

First, open the project's integrated terminal in VS Code and install the necessary npm packages.

```bash
npm install
```

### 2. Set Up Environment Variables

The application requires API keys and configuration details to connect to backend services like Firebase.

1.  Create a copy of the `.env` file and name it `.env.local`.
2.  Open `.env.local` and fill in your Firebase project configuration. You can find these values in your Firebase project settings under "General".
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
    ```
3.  **Optional:** To enable the web search AI tool, you need an API key from [SerpApi](https://serpapi.com/). Add it to your `.env.local` file:
    ```
    SERP_API_KEY="your_serp_api_key"
    ```
4.  **Optional:** To connect to an n8n workflow from the "Capture Need" page, add your webhook URL:
    ```
    NEXT_PUBLIC_N8N_WEBHOOK_URL="your_n8n_webhook_url"
    ```

### 3. Run the Development Servers

This project requires two separate processes to run simultaneously: the Next.js web application and the Genkit AI service.

1.  **Start the Web App**: In your first terminal, run the `dev` script.
    ```bash
    npm run dev
    ```
    Your application will be available at `http://localhost:9002`.

2.  **Start the AI Service**: Open a second terminal (`+` icon in the terminal panel) and run the `genkit:watch` script. This starts the Genkit flows and tools, and it will automatically restart when you make changes to your AI files.
    ```bash
    npm run genkit:watch
    ```

Now you're all set! You can start exploring and modifying the application.
