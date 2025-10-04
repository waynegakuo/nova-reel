# 🎬 Nova Reel

Nova Reel is an Angular-based application for browsing, discovering, and getting personalized recommendations for movies and TV shows. It leverages Google's Genkit AI platform to provide intelligent recommendations based on user favorites.

## 📱 About the App

Nova Reel helps film and TV enthusiasts discover new content to watch through a modern, responsive web interface. The application combines data from The Movie Database (TMDB) with Google's Genkit AI to create a powerful recommendation engine that learns from user preferences.

### ✨ Key Features

- 🔥 Browse trending movies and TV shows
- 🔍 Filter content by categories (Popular, Top Rated, Now Playing, etc.)
- 🔎 Search for specific titles with real-time results and pagination
- ℹ️ View detailed information about movies and TV shows
- ⭐ Save favorites for quick access and personalized experience
- 🤖 **Smart Recommendations**: Get AI-powered recommendations using natural language queries
- 🎯 **For You**: Personalized recommendations based on your viewing history and favorites
- 🎬 **Guess the Movie**: Interactive game to identify movies and TV shows from screenshots using AI
- 🧠 Advanced AI features powered by Google's Genkit and Gemini 2.5 Pro
- 📱 Fully responsive design optimized for all devices
- 🎨 Modern UI with intuitive tab-based navigation
- ⚡ Real-time loading states and smooth animations

## 🏗️ Architecture

Nova Reel is built with a modern tech stack that combines frontend and backend technologies:

### 🖥️ Frontend

- **🅰️ Angular**: The frontend is built with Angular, using standalone components and signals for reactive state management
- **🔐 Firebase Authentication**: For user authentication and management
- **🗄️ Firebase Firestore**: For storing user favorites and preferences
- **🔥 Angular Fire**: For integrating Firebase services with Angular

### ☁️ Backend

- **⚡ Firebase Functions**: Serverless backend functions that handle API requests and AI processing
- **🧠 Genkit**: Google's AI platform for building generative AI applications
- **💫 Gemini 2.5 Pro**: The underlying AI model used for generating recommendations
- **🎞️ TMDB API**: External API for fetching movie and TV show data

### 🤖 AI Features

Nova Reel leverages Google's Genkit AI platform to provide intelligent features:

#### 🎯 AI Recommendation Engine

Nova Reel features two powerful AI-driven recommendation systems:

##### 🤖 Smart Recommendations (Natural Language Queries)

The Smart Recommendations feature allows users to describe what they want to watch in natural language:

1. **🗣️ Natural Language Input**: Users can type queries like "I want a thrilling, suspenseful movie" or "My niece likes cartoons that have sci-fi in them"
2. **🧠 AI Processing**: The system uses Genkit to:
   - 🔍 Analyze the natural language query for mood, genre, target audience, and themes
   - 📊 Consider user's viewing history as additional context (if available)
   - 💫 Use Gemini 2.5 Pro to generate highly targeted recommendations
   - 🎯 Provide detailed reasoning explaining why each recommendation matches the request
3. **📱 Smart Display**: Results are shown in the dedicated "Smart Recommendations" tab with explanations

##### 🎯 For You (Favorites-Based Recommendations)

The traditional recommendation engine analyzes user favorites for personalized suggestions:

1. **📊 Data Collection**: The app stores user favorites in Firebase Firestore
2. **🧠 AI Processing**: When a user requests recommendations, the app calls a Firebase Function that uses Genkit to:
   - 📥 Fetch the user's favorites from Firestore
   - 🔄 Create a context from these favorites to inform the AI
   - 💫 Use the Gemini 2.5 Pro model to generate personalized recommendations
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

## 🛠️ Setup and Installation

### Try it out in Firebase Studio 🧪

For the easiest setup experience, use Firebase Studio:

1. Click the button below to launch the project in Firebase Studio:

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

2. Once the project loads in Firebase Studio, open the Terminal tab
3. Install the project dependencies by running these commands one by one:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

## 🔥 Firebase Project Setup & Configuration

Now that you have the code ready, let's set up Firebase and the required APIs:

### Step 1: Create a Firebase Project 🏗️

1. **Open the Firebase Console:** Go to [Firebase Console](https://console.firebase.google.com/)
2. **Create a new project:**
   - Click "Add project"
   - Enter a project name (e.g., "nova-reel-app")
   - Follow the setup wizard (you can disable Google Analytics if not needed)
3. **⚠️ Important - Upgrade to Blaze Plan:**
   - In your Firebase project, go to the "Usage and billing" tab
   - Click "Modify plan" and select "Blaze (Pay as you go)"
   - This is required for Cloud Functions and AI features
   - Don't worry - the free tier is generous for development and testing

### Step 2: Enable Required APIs ☁️

Your Firebase project needs certain Google Cloud APIs enabled:

1. **Go to Google Cloud Console:**
   - Visit the [Google Cloud Console](https://console.cloud.google.com/)
   - Make sure your Firebase project is selected in the project dropdown
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
   This will open your browser for authentication.

3. **Initialize Firebase in your project:**
   ```bash
   firebase init
   ```

4. **Configure Firebase services** when prompted:
   - **Select services:** Choose "Functions" and "Firestore" (use space to select, enter to confirm)
   - **Project selection:** Choose "Use an existing project" and select your Firebase project
   - **Language for Functions:** Select "TypeScript" 
   - **ESLint:** Choose "No" (you can always enable it later if needed) 
   - **Install dependencies:** Choose "Yes"
   - **Firestore Rules:** Accept the default `firestore.rules` file
   - **Firestore Indexes:** Accept the default `firestore.indexes.json` file
   - **⚠️ Important:** When asked to overwrite existing files, select "No" to preserve the project code

### Step 4: Link Your Firebase Project 🔄

After initializing Firebase, you need to make sure your project is linked correctly:

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

### Step 5: Configure Firebase Web App 🔥

Now you need to register a web app in Firebase and get the configuration:

1. **Register your web app:**
   - Go to [Firebase Console](https://console.firebase.google.com/) and select your project
   - Click the gear icon (⚙️) next to "Project Overview" → "Project settings"
   - Scroll to "Your apps" section
   - If you don't have a web app yet, click "Add app" → Web icon (`</>`)
   - Give your app a name (e.g., "Nova Reel Web App") and click "Register app"

2. **Get your Firebase configuration:**
   - In the "SDK setup and configuration" section, select "Config"
   - Copy the configuration object (it looks like this):
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

## 🔐 API Keys Setup

### Step 6: Get TMDB API Key 🎬

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

### Step 7: Set Up API Keys as Firebase Secrets 🔑

1. **Set TMDB API Key:**
   ```bash
   cd functions
   firebase functions:secrets:set TMDB_API_BEARER_TOKEN
   ```
   When prompted, paste your TMDB Bearer Token.

2. **Set Gemini API Key:**
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   When prompted, paste your Gemini API key.
   
   > **📝 How to get Gemini API Key:** Go to [Google AI Studio](https://aistudio.google.com/app/apikey), create an API key, and copy it.

3. **Return to project root:**
   ```bash
   cd ..
   ```

4. **Create local environment file (for development):**
   ```bash
   cd functions
   echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" > .env
   cd ..
   ```

## 🚀 Deployment and Running

### Step 8: Deploy and Run Your Application

1. **Deploy Firebase Functions:**
   ```bash
   firebase deploy --only functions
   ```
   This will deploy your backend functions to Firebase.

2. **Run the application locally:**
   ```bash
   ng serve
   ```
   Your app will be available at `http://localhost:4200`

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

## 📝 Usage

### 🎬 Main Navigation Tabs

Nova Reel features an intuitive tab-based interface with the following sections:

1. **🎥 Movies**: Browse trending, popular, top-rated, now playing, and upcoming movies
2. **📺 TV Shows**: Explore popular, top-rated, on-the-air, and airing today TV shows
3. **⭐ Favorites**: Quick access to your saved movies and TV shows
4. **🎯 For You**: Personalized recommendations based on your viewing history and favorites
5. **🤖 Smart Recommendations**: AI-powered recommendations using natural language queries
6. **🎬 Guess the Movie**: Interactive game to identify movies/TV shows from screenshots
7. **🧠 Trivia Challenge**: Test your knowledge with timed trivia questions about any movie or TV show

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

## 💻 Development

### 🏃‍♂️ Running the Development Server

```
ng serve
```

### 🏗️ Building for Production

```
ng build
```

### 🧪 Running Tests

```
ng test
```

## 📚 Additional Resources

- 📖 [Genkit Documentation](https://genkit.dev/)
- 🔥 [Firebase Documentation](https://firebase.google.com/docs)
- 🅰️ [Angular Documentation](https://angular.dev/overview)
- 🎬 [TMDB API Documentation](https://developer.themoviedb.org/docs/getting-started)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
