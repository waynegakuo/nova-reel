<div align="center">

# 🎬 Nova Reel

### *AI-Powered Movie & TV Show Recommendations*

[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Google AI](https://img.shields.io/badge/Google%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

Nova Reel is a modern, AI-powered Angular application that revolutionizes how you discover movies and TV shows. Built with Google's Genkit AI framework, it provides intelligent, personalized recommendations that understand your preferences and help you find your next favorite watch.

</div>

## 🌟 About the App

Nova Reel empowers film and TV enthusiasts to discover new content through an intuitive, responsive web interface. By combining comprehensive data from The Movie Database (TMDB) with cutting-edge Google Genkit AI technology, it creates a sophisticated recommendation engine that learns and adapts to your viewing preferences.

### ✨ Key Features

<table>
<tr>
<td width="50%">

**📱 Core Features**
- 🔥 Browse trending movies and TV shows
- 🔍 Advanced filtering by categories
- 🔎 Real-time search with pagination
- ℹ️ Detailed movie and TV show information
- ⭐ Personal favorites management

</td>
<td width="50%">

**🤖 AI-Powered Features**
- 🤖 **Smart Recommendations**: Natural language queries
- 🎯 **For You**: Personalized suggestions
- 🎬 **Guess the Movie**: Screenshot identification
- 🧠 **Trivia Challenge**: AI-generated questions
- 💫 Powered by Gemini 3 Pro

</td>
</tr>
<tr>
<td width="50%">

**🎨 User Experience**
- 📱 Fully responsive design
- 🎨 Modern, intuitive interface
- 🗂️ Tab-based navigation
- ⚡ Real-time loading states

</td>
<td width="50%">

**🔧 Technical Features**
- 🔐 Firebase Authentication
- 🗄️ Firestore database
- ☁️ Serverless functions
- 🌐 TMDB API integration

</td>
</tr>
</table>

## 🏗️ Architecture

Nova Reel is built with a modern tech stack that combines frontend and backend technologies:

### 🖥️ Frontend

- **🅰️ Angular**: The frontend is built with Angular, using standalone components and signals for reactive state management
- **🔐 Firebase Authentication**: For user authentication and management
- **🗄️ Firebase Firestore**: For storing user favorites and preferences
- **🔥 Angular Fire**: For integrating Firebase services with Angular

### ☁️ Backend

- **⚡ Firebase Functions**: Serverless backend functions that handle API requests and AI processing
- **🧠 Genkit**: Google's open-source AI framework for building generative AI applications
- **💫 Gemini 3 Pro**: The underlying AI model used for generating recommendations
- **🎞️ TMDB API**: External API for fetching movie and TV show data

### 🤖 AI Features

Nova Reel leverages Google's Genkit AI framework to provide intelligent features:

#### 🎯 AI Recommendation Engine

Nova Reel features two powerful AI-driven recommendation systems:

##### 🤖 Smart Recommendations (Natural Language Queries)

The Smart Recommendations feature allows users to describe what they want to watch in natural language:

1. **🗣️ Natural Language Input**: Users can type queries like "I want a thrilling, suspenseful movie" or "My niece likes cartoons that have sci-fi in them"
2. **🧠 AI Processing**: The system uses Genkit to:
   - 🔍 Analyze the natural language query for mood, genre, target audience, and themes
   - 📊 Consider user's viewing history as additional context (if available)
   - 💫 Use Gemini 3 Pro to generate highly targeted recommendations
   - 🎯 Provide detailed reasoning explaining why each recommendation matches the request
3. **📱 Smart Display**: Results are shown in the dedicated "Smart Recommendations" tab with explanations

##### 🎯 For You (Favorites-Based Recommendations)

The traditional recommendation engine analyzes user favorites for personalized suggestions:

1. **📊 Data Collection**: The app stores user favorites in Firebase Firestore
2. **🧠 AI Processing**: When a user requests recommendations, the app calls a Firebase Function that uses Genkit to:
   - 📥 Fetch the user's favorites from Firestore
   - 🔄 Create a context from these favorites to inform the AI
   - 💫 Use the Gemini 3 Pro model to generate personalized recommendations
   - 💡 Provide reasoning for the recommendations
3. **📱 Recommendation Display**: The frontend displays these recommendations in the "For You" tab, along with the AI's reasoning

#### 🎬 Movie & TV Show Identification

The "Guess the Movie" feature uses Genkit's image analysis capabilities to identify movies and TV shows from screenshots:

1. **📸 Image Upload**: Users upload a screenshot from a movie or TV show
2. **🧠 AI Analysis**: The app calls a Firebase Function that uses Genkit to:
   - 🔍 Analyze the image for distinctive elements like characters, settings, and visual style
   - 🎯 Identify the most likely movie or TV show
   - 🔄 Use the TMDB API to confirm the identification and retrieve additional details
3. **📱 Result Display**: The frontend displays the identified movie or TV show, along with confidence score, overview, and poster

---

## 🚀 Getting Started

### 🧪 Quick Start with Firebase Studio

**The fastest way to get Nova Reel running:**

<div align="center">

<a href="https://studio.firebase.google.com/import?url=https%3A%2F%2Fgithub.com%2Fwaynegakuo%2Fnova-reel">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.firebasestudio.dev/btn/try_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.firebasestudio.dev/btn/try_light_32.svg">
    <img
      height="32"
      alt="Try in Firebase Studio"
      src="https://cdn.firebasestudio.dev/btn/try_blue_32.svg">
  </picture>
</a>

*Click above to launch Nova Reel in Firebase Studio*

</div>

**After launching:**

1. **📂 Open Terminal** - Navigate to the Terminal tab in Firebase Studio
2. **📦 Install Dependencies** - Run these commands one by one:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

---

## ⚙️ Configuration Guide

> **💡 Complete Setup Guide** - Follow these steps to configure Firebase and required APIs for Nova Reel.


## 🏗️ Step 1: Create Firebase Project</b>

### Firebase Console Setup

1. **🌐 Open Firebase Console**
   - Navigate to [Firebase Console](https://console.firebase.google.com/)

2. **➕ Create New Project**
   - Click "Create a new Firebase project"
   - Enter project name: `nova-reel-app` (or your preferred name)
   - Google Analytics is optional, so no need to enable it

3. **💳 Upgrade to Blaze Plan** ⚠️ **Required for AI Features**
   - Locate billing section in bottom-left sidebar
   - Click "Upgrade" next to Spark plan
   - Select "Pay as you Go - Blaze Plan"
   - Choose "Google Cloud Platform Trial Billing Account" 
   - Set budget alert (e.g., $2 USD)
   - Click "Link Cloud Billing Account"

### Step 2: Enable Required APIs ☁️

Your Firebase project needs certain Google Cloud APIs enabled:

1. **Go to Google Cloud Console:**
   - Visit the [Google Cloud Console](https://console.cloud.google.com/)
   - Make sure your Firebase project is selected in the project dropdown
   - Click on "Dashboard" to see the project's overview page
2. **Enable the Secret Manager API:**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Secret Manager API"
   - Click on it and press "Enable"
   
> **Note:** Other APIs (Cloud Functions, Vertex AI, etc.) are automatically enabled when you deploy Firebase Functions.

### Step 3: Install and Setup Firebase CLI 🛠️

> **📝 Note for Firebase Studio users:** Skip the CLI installation step and go directly to logging in.

1. **Install Firebase CLI** (skip if using Firebase Studio):
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase:**
   ```bash
   firebase login
   ```
   
3. In the terminal, you will be prompted to enter to visit a URL to authenticate using an authorization code. 
4. Open the URL, select the same Google account you used to create the Firebase project. 
5. Click the "Yes, I just ran this command" button. 
6. The second step shows you a session code that should tally with the one seen back in your project's terminal. Click "Yes". 
7. In Step 3, copy the code and paste it into the terminal.

### Step 4: Link Your Firebase Project 🔄

You need to make sure your project is linked correctly:

**Method 1: Using Firebase CLI (Recommended)**

Set your Firebase project as the default:
```bash
firebase use YOUR_PROJECT_ID
```
> Replace `YOUR_PROJECT_ID` with your actual Firebase project ID (you can find this in the Firebase Console URL or project settings).

**Method 2: Manual Configuration**

If the CLI method doesn't work, you can edit the `.firebaserc` file manually:

1. Open `.firebaserc` in your project root directory
2. Update it to match your project ID:
   ```json
   {
     "projects": {
       "default": "YOUR_PROJECT_ID"
     }
   }
   ```

> **💡 Tip:** You can verify your project is linked correctly by running `firebase projects:list` to see your available projects.

### Step 5: Configure Firebase Services
   ```bash
   firebase init
   ```
Configure Firebase services when prompted:
   - **Select services:** Choose "Functions" and "Firestore" (use space to select, enter to confirm)
   - **Select a location for your Firestore database:** Choose a region closer to your users
   - **Firestore Rules:** Accept the default `firestore.rules` file
   - **Firestore Indexes:** Accept the default `firestore.indexes.json` file
   - **Initialize or overwrite:** When asked to either initialize or overwrite the codebase, select "Overwrite"
   - **Language for Functions:** Select "TypeScript"
   - **ESLint:** Choose "No" (you can always enable it later if needed)
   - **⚠️ Important:** When asked to overwrite existing files, select "No" to preserve the project code
   - **Install dependencies:** Choose "Yes"

### Step 6: Configure Firebase Web App 🔥

Now you need to register a web app in Firebase and get the configuration:

1. **Register your web app:**
   - Go to [Firebase Console](https://console.firebase.google.com/) and select your project
   - Click the gear icon (⚙️) next to "Project Overview" → "Project settings"
   - Scroll to "Your apps" section
   - If you don't have a web app yet, click "Add app" → Web icon (`</>`)
   - Give your app a name (e.g., "Nova Reel Web App")
   - Check the Firebase Hosting box
   - Click "Register app"

2. **Get your Firebase configuration:**
   - In the "Add Firebase SDK" step, copy the configuration object (it looks like this):
   ```javascript
   {
     apiKey: "your-api-key-here",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   }
   ```

3. **Update your environment files:**
   
   Open both environment files and replace the `firebaseConfig` object with your own:
   
   **For `src/environments/environment.ts` (production):**
   ```typescript
   export const environment = {
     production: true,
     firebaseConfig: {
       // Paste your Firebase config here
       apiKey: "your-api-key-here",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your-app-id",
       measurementId: "your-measurement-id"
     }
   };
   ```
   
   **For `src/environments/environment.development.ts` (development):**
   ```typescript
   export const environment = {
     production: false,
     firebaseConfig: {
       // Same Firebase config as above
     }
   };
   ```
   Click "Continue to console" to continue.

## Firebase Authentication Setup

### Step 7: Enable Authentication
- Click the "Build" dropdown in the sidebar
- Select "Authentication"
- Click "Get started"
- Select "Google"
- Toggle the "Enable" switch
- Provide a support email address
- Click "Save"

##  Firebase Firestore Database

### Step 8: Enable Firestore Database
- Click the "Build" dropdown in the sidebar
- Select "Firestore Database"
- Click "Create database"
- Select "Standard Edition"
- You can leave the database ID as "default"
- Select the closest location to your users
- Click "Next"
- Select "Start in test mode"
- Click "Create"

## 🔐 API Keys Setup

### Step 9: Get TMDB API Key 🎬

Nova Reel uses The Movie Database (TMDB) API to fetch movie and TV show data:

1. **Create TMDB Account:**
   - Go to [TMDB](https://www.themoviedb.org/)
   - Sign up for a new account or log in if you already have one

2. **Request API Access:**
   - Click your profile avatar → Settings → API
   - Click "Request an API Key" → "Developer"
   - Fill out the application form (you can mention this is for learning/personal use)
   - Accept the terms of use

3. **Get Your Bearer Token:**
   - Once approved, go back to Settings → API
   - Copy your **API Read Access Token** (this is your Bearer Token)
   - It starts with "eyJ..." and is quite long

### Step 10: Set Up API Keys as Firebase Secrets 🔑

1. **Set TMDB API Key:**
   ```bash
   cd functions
   firebase functions:secrets:set TMDB_API_BEARER_TOKEN
   ```
   When prompted, paste your TMDB Bearer Token. The input is masked so you won't see the pasted token but it will be there. Just paste ONCE!

2. **Set Gemini API Key:**
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   When prompted, paste your Gemini API key.
   
   > **📝 How to get Gemini API Key:** Go to [Google AI Studio](https://aistudio.google.com/app/apikey), create an API key by attaching to a project, and copy it. The input is masked, so you won't see the pasted key, but it will be there. Just paste ONCE!

4. **Create local environment file (for development):**
   ```bash
   echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" > .env
   cd ..
   ```
   Replace `your_actual_gemini_api_key_here` with your actual Gemini API key.

## 🚀 Deployment and Running

### Step 11: Deploy and Run Your Application

1. **Deploy Firebase Functions:**
   ```bash
   firebase deploy --only functions
   ```
   This will deploy your backend functions to Firebase.

2. **Run the application locally:**
   ```bash
   cd ..
   ng serve
   ```
   Your app will be available at `http://localhost:4200`. However, on Firebase Studio, hold Ctrl+Click on the localhost URL to open it in a new tab.

3. **Build for production (optional):**
   ```bash
   ng build
   firebase deploy --only hosting
   ```

> **🎉 Congratulations!** Your Nova Reel app should now be running with full AI-powered movie recommendations!

## 🧠 Building an AI Recommendation Engine with Genkit

Nova Reel demonstrates how to build an AI recommendation engine using Genkit. Here's how it works:

### 1️⃣ Setting Up Genkit

In the Firebase Functions (`functions/src/index.ts`), Genkit is configured with the Gemini model:

```typescript
// Configure Genkit
const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY }),
  ],
  model: googleAI.model('gemini-2.5-pro'), // Specify your Gemini model
});
```

### 2️⃣ Creating a Custom Tool for TMDB Data

A custom tool is defined to allow the AI to fetch movie and TV show data from TMDB:

```typescript
export const getTmdbDataTool = ai.defineTool(
  {
    name: 'getTmdbData',
    description: 'Fetches movie or TV show data from TMDB using specific endpoint, ID, or query.',
    inputSchema: z.object({
      endpoint: z.string().describe('TMDB API endpoint (e.g., "movie", "tv", "search/movie")'),
      id: z.number().optional().describe('ID for specific movie/TV show'),
      query: z.string().optional().describe('Search query string'),
    }),
    outputSchema: z.any().describe('JSON data from TMDB API response'),
  },
  async ({ endpoint, id, query }) => {
    const url = constructTmdbUrl(endpoint, { id, query });
    return await executeTmdbRequest(url, 'getTmdbDataTool');
  }
);
```

### 3️⃣ Defining the Recommendation Flow

A Genkit flow is defined to handle the recommendation process:

```typescript
export const _getRecommendationsFlowLogic = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: RecommendationInputSchema,
    outputSchema: RecommendationOutputSchema,
  },
  async (input) => {
    // Fetch user's favorite movies/tv shows from Firestore
    const userFavoritesRef = db.collection('users').doc(input.userId).collection('favorites');
    const favoritesSnapshot = await userFavoritesRef.get();
    const favoriteItems = favoritesSnapshot.docs.map(doc => doc.data());

    // Prepare context for the AI from user favorites
    let favoritesContext = favoriteItems.map(item =>
      `${item['type'] === 'movie' ? 'Movie' : 'TV Show'}: ${item['title']} (TMDB ID: ${item['tmdbId']})`
    ).join('; ');

    // Generate recommendations using the AI model
    const { output } = await ai.generate({
      tools: [getTmdbDataTool], // Make the TMDB data tool available to the model
      prompt: `
        You are a highly intelligent movie and TV show recommendation assistant.
        The user has a list of favorite movies and TV shows.
        User's favorites: ${favoritesContext}

        Based on these favorites, recommend ${input.count} additional movies or TV shows that the user might enjoy.
        Consider their genres, actors, directors, themes, and overall vibe.
        Prioritize items with high TMDB ratings.
        Avoid recommending any of the items already in the user's favorites list.
        
        For each recommendation, provide the title, whether it's a "movie" or "tv" show, its TMDB ID, 
        a brief overview, and its poster path.
        
        Explain your reasoning briefly after the recommendations.
      `,
      output: {
        format: 'json',
        schema: RecommendationOutputSchema,
      },
    });

    return output || { recommendations: [], reasoning: 'Unable to generate recommendations.' };
  }
);
```

### 4️⃣ Exposing the Flow as a Firebase Function

The flow is exposed as a callable Firebase Function:

```typescript
export const getRecommendationsFlow = onCallGenkit(
  {
    secrets: [TMDB_BEARER_TOKEN],
    region: 'africa-south1',
    cors: true,
  },
  _getRecommendationsFlowLogic
);
```

### 5️⃣ Calling the Function from the Frontend

In the frontend (`src/app/services/media/media.service.ts`), the function is called to get recommendations:

```typescript
async getAiRecommendationsData(count: number = 5): Promise<AiRecommendationResponse> {
  const userId = this.authService.getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to get AI recommendations');
  }

  const callableGetRecommendations = httpsCallable(this.functions, 'getRecommendationsFlow');
  try {
    const result = await callableGetRecommendations({
      userId: userId,
      count: count
    });
    return result.data as AiRecommendationResponse;
  } catch (error: any) {
    console.error('Error fetching AI recommendations from Cloud Function:', error);
    throw error;
  }
}
```

### 6️⃣ Displaying Recommendations

The recommendations are displayed in the "For You" tab of the landing page, along with the AI's reasoning for the recommendations.

---

## 📖 User Guide

### 🧭 Navigation Overview

<div align="center">

| Tab | Feature | Description |
|-----|---------|-------------|
| 🎥 | **Movies** | Browse trending, popular, top-rated & upcoming |
| 📺 | **TV Shows** | Explore popular, top-rated & currently airing |
| ⭐ | **Favorites** | Quick access to your saved content |
| 🎯 | **For You** | Personalized AI recommendations |
| 🤖 | **Smart Recs** | Natural language query recommendations |
| 🎬 | **Guess Movie** | Screenshot identification game |
| 🧠 | **Trivia** | Timed knowledge challenges |

</div>

### 🔧 How to Use Each Feature

#### 🔍 Browsing Content
- Use the "Movies" and "TV Shows" tabs to browse trending content
- Filter by categories using the category buttons (Popular, Top Rated, etc.)
- Use the search bar to find specific titles with real-time results
- Navigate through pages using the pagination controls

#### ⭐ Managing Favorites
- Click on any movie or TV show to view detailed information
- Click the "Add to Favorites" button on any detail page
- Access all your favorites in the dedicated "Favorites" tab

#### 🤖 Smart Recommendations
- Navigate to the "Smart Recommendations" tab
- Describe what you want to watch in natural language (e.g., "I want something thrilling and suspenseful")
- Click "Get Smart Recommendations" to receive AI-powered suggestions
- View the reasoning behind each recommendation

#### 🎯 For You Recommendations
- Navigate to the "For You" tab to see personalized recommendations
- Recommendations are automatically generated based on your favorites
- Click "Refresh Recommendations" to get new suggestions
- View detailed explanations for why each item was recommended

#### 🎬 Guess the Movie Game
- Navigate to the "Guess the Movie" tab for an interactive experience
- Upload a screenshot from any movie or TV show
- Let the AI analyze and identify the content
- View confidence scores and detailed information about identified content

#### 🧠 Trivia Challenge
- Select any movie or TV show from the browse tabs or search results
- Click the "Trivia Challenge" button on the movie/TV show detail page
- Answer timed trivia questions (30 seconds per question) about the selected content
- Track your score and performance throughout the challenge
- View your final results and statistics when the game is complete
- Challenge yourself again or try trivia for different movies and shows

---

## 🛠️ Development

<table>
<tr>
<td width="50%">

### 🏃‍♂️ **Development Server**
```bash
ng serve
```
*Starts local dev server at `http://localhost:4200`*

### 🏗️ **Production Build**
```bash
ng build
```
*Creates optimized build in `dist/` folder*

</td>
<td width="50%">

### 🧪 **Run Tests**
```bash
ng test
```
*Executes unit tests via Karma*

### 🚀 **Deploy to Firebase**
```bash
firebase deploy
```
*Deploys both functions and hosting*

</td>
</tr>
</table>

---

## 📚 Resources & Documentation

<div align="center">

### 🔗 **Quick Links**

[![Genkit Docs](https://img.shields.io/badge/Genkit-Documentation-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://genkit.dev/)
[![Firebase Docs](https://img.shields.io/badge/Firebase-Documentation-039BE5?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/docs)

[![Angular Docs](https://img.shields.io/badge/Angular-Documentation-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/overview)
[![TMDB API](https://img.shields.io/badge/TMDB-API%20Docs-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://developer.themoviedb.org/docs/getting-started)

</div>

---

<div align="center">

## 📄 License

**MIT License** - See the [LICENSE](LICENSE) file for details.

---

### 🌟 **Star this project if you found it helpful!**

*Made with ❤️ using Angular, Firebase, Genkit and Gemini*

</div>
