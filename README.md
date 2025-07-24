# 🎬 Nova Reel

Nova Reel is an Angular-based application for browsing, discovering, and getting personalized recommendations for movies and TV shows. It leverages Google's Genkit AI platform to provide intelligent recommendations based on user favorites.

## 📱 About the App

Nova Reel helps film and TV enthusiasts discover new content to watch through a modern, responsive web interface. The application combines data from The Movie Database (TMDB) with Google's Genkit AI to create a powerful recommendation engine that learns from user preferences.

### ✨ Key Features

- 🔥 Browse trending movies and TV shows
- 🔍 Filter content by categories (Popular, Top Rated, Now Playing, etc.)
- 🔎 Search for specific titles
- ℹ️ View detailed information about movies and TV shows
- ⭐ Save favorites for quick access
- 🤖 Get AI-powered personalized recommendations based on your favorites
- 📱 Responsive design for all devices

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
- **💫 Gemini 2.0 Flash**: The underlying AI model used for generating recommendations
- **🎞️ TMDB API**: External API for fetching movie and TV show data

### 🤖 AI Recommendation Engine

The heart of Nova Reel is its AI recommendation engine, which uses Genkit to analyze user favorites and generate personalized recommendations:

1. **📊 Data Collection**: The app stores user favorites in Firebase Firestore
2. **🧠 AI Processing**: When a user requests recommendations, the app calls a Firebase Function that uses Genkit to:
   - 📥 Fetch the user's favorites from Firestore
   - 🔄 Create a context from these favorites to inform the AI
   - 💫 Use the Gemini 2.0 Flash model to generate personalized recommendations
   - 💡 Provide reasoning for the recommendations
3. **📱 Recommendation Display**: The frontend displays these recommendations in the "For You" tab, along with the AI's reasoning

## 🛠️ Setup and Installation

### Try it out in Firebase Studio 🧪

Click this button to launch the project in Firebase Studio and follow the steps below to get started.

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


### 📋 Setting up Locally: Prerequisites

- 📦 Node.js (v18 or later)
- 🅰️ Angular CLI (v19 or later)
- 🔥 Firebase CLI
- ☁️ A Firebase project with Firestore and Functions enabled
- 🎬 TMDB API key
- 🧠 Gemini API key

### 🔧 Environment Setup

1. 📥 Clone the repository:
   ```
   git clone <repository-url>
   cd nova-reel
   ```

2. 📦 Install dependencies:
   ```
   npm install
   cd functions
   npm install
   cd ..
   ```

### 🔥 Firebase Project Setup & TMDB API Key

#### 🏗️ Create a Firebase Project:

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click "Add project" and follow the prompts to create your project.
3. ⚠️ **Important:** Upgrade your project to the Blaze (pay-as-you-go) plan. Cloud Functions and Vertex AI (which Genkit uses) require a billing-enabled project. Don't worry, free tiers are generous for testing.

#### 🛠️ Install Firebase CLI:

1. Open your terminal/command prompt.
2. Install the Firebase CLI globally:
   ```
   npm install -g firebase-tools
   ```
3. Log in to Firebase:
   ```
   firebase login
   ```

#### 🚀 Initialize Firebase in Your Project:

1. Navigate to your project's root directory (you should already be there after cloning the repository).
2. Initialize Firebase:
   ```
   firebase init
   ```
3. Select "Functions" and "Firestore" when prompted.
4. Choose your existing Firebase project to link to.
5. Select TypeScript for functions (highly recommended).
6. For Firestore, accept the default rules file (you can change it later).
7. Do NOT overwrite existing files if prompted.

#### 🔄 Update the .firebaserc File:

You can update the .firebaserc file in two ways:

**Option 1: Using Firebase CLI (Recommended)**

Run the following command to set your Firebase project ID:
```
firebase use YOUR_PROJECT_ID
```
Replace `YOUR_PROJECT_ID` with the project ID of the Firebase project you created. This command will automatically update your .firebaserc file.

**Option 2: Manual Editing**

1. Open the `.firebaserc` file in your project root directory.
2. Replace the default project name with your Firebase project ID:
   ```json
   {
     "projects": {
       "default": "YOUR_PROJECT_ID"
     }
   }
   ```
   Replace `YOUR_PROJECT_ID` with the project ID of the Firebase project you created.

#### 🔥 Add Firebase Configuration to Your Project:

1. Go to your Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Click on the gear icon (⚙️) next to "Project Overview" and select "Project settings".
3. Scroll down to the "Your apps" section and select your web app (or create one if you haven't already).
4. Under the "SDK setup and configuration" section, select "Config" to view your Firebase configuration object.
5. Copy the configuration object that looks like this:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   }
   ```
6. Open the environment files in your project:
   - For production: `src/environments/environment.ts`
   - For development: `src/environments/environment.development.ts`
7. Replace the existing `firebaseConfig` object with your own Firebase configuration:
   ```typescript
   export const environment = {
     production: true, // or false for environment.development.ts
     firebaseConfig: {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID",
       measurementId: "YOUR_MEASUREMENT_ID"
     }
   };
   ```

#### 🎬 Get TMDB API Key:

1. Go to [TMDB](https://www.themoviedb.org/).
2. Sign up or log in.
3. Go to your user profile (click your avatar) -> Settings -> API.
4. Request a new API key (Developer/v3).
5. Note down your API Read Access Token (Bearer Token). It starts with "eyJ...".

#### 🔐 Set TMDB API Key as Firebase Secret:

1. Navigate to your functions directory:
   ```
   cd functions
   ```
2. Set the TMDB API key as a Firebase secret:
   ```
   firebase functions:secrets:set TMDB_API_BEARER_TOKEN
   ```
3. Paste your TMDB Bearer Token when prompted.
4. Return to the project root:
   ```
   cd ..
   ```

### 🔑 API Keys and Deployment

1. 🔐 Enable the "Secret Manager API" in the Google Cloud Console for your Firebase project

2. 🔑 Set up your API keys:
   
   a. Create a `.env` file in the `functions` directory with your Gemini API key (for local development):
   ```
   cd functions
   echo "GEMINI_API_KEY=your_gemini_api_key" > .env
   cd ..
   ```
   
   b. Set up the Gemini API key as a Firebase secret (for production deployment):
   ```
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   
   > **Note:** When running this command, you'll be prompted to enter the actual secret value. The GEMINI_API_KEY is needed both as an environment variable (for local development) and as a Firebase secret (for production deployment).

3. 🔥 Configure Firebase:
   ```
   firebase use your-project-id
   ```

4. 🚀 Deploy Firebase Functions:
   ```
   firebase deploy --only functions
   ```

5. 🏃‍♂️ Run the application locally:
   ```
   ng serve
   ```

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
  model: googleAI.model('gemini-2.0-flash'), // Specify your Gemini model
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

1. **🔍 Browse Content**: Use the "Movies" and "TV Shows" tabs to browse trending content
2. **ℹ️ View Details**: Click on any movie or TV show to view detailed information
3. **⭐ Add to Favorites**: Click the "Add to Favorites" button on any movie or TV show detail page
4. **🤖 Get Recommendations**: Navigate to the "For You" tab to see personalized recommendations based on your favorites
5. **🔄 Refresh Recommendations**: Click the "Refresh Recommendations" button to get new recommendations

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

- 📖 [Genkit Documentation](https://genkit.dev/docs)
- 🔥 [Firebase Documentation](https://firebase.google.com/docs)
- 🅰️ [Angular Documentation](https://angular.io/docs)
- 🎬 [TMDB API Documentation](https://developer.themoviedb.org/docs)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
