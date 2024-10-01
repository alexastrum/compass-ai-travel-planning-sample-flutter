# Compass Project Demo in Flutter

This is a travel demo using Firebase Data Connect to find ideal itineraries from
a database of travel plans. To learn more about how this demo was created,
please see [this blog article](https://developers.googleblog.com/en/how-firebase-genkit-helped-add-ai-to-our-compass-app/).
To build a version of this demo for yourself with Firestore, [please see this
codelab](https://firebase.google.com/codelabs/ai-genkit-rag).

If you want to try out an early preview of Data Connect, we have instructions
below for you to follow!

## Try it out today

We recommend trying this project in IDX since it handles all dependencies for you. You are able to launch this project in IDX and get going testing with only slight configuration required.

<a href="https://idx.google.com/import?url=https%3A%2F%2Fgithub.com%2FFirebaseExtended%2Fcompass-ai-travel-planning-sample-flutter">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.idx.dev/btn/try_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.idx.dev/btn/try_light_32.svg">
    <img
      height="32"
      alt="Try in IDX"
      src="https://cdn.idx.dev/btn/try_purple_32.svg">
  </picture>
</a>

### Run the app in Project IDX

Open the app in Project IDX using the button above.

1. Click on the IDX side bar icon and get an Gemini API key with the Gemini integration. After authenticating you can get an API key copied to your clipboard. Paste this value into env section of the `.idx/dev.nix` and rebuild your environment. Make sure not to commit your API key.

1. Next click on the Firebase side bar icon to open the Firebase side bar panel. Click the "Connect to Local PostgreSQL" button to run the Data Connect emulator.

1. You will need to click into the terminal titled genkit-start and accept the terms of service and install the genkit CLI.

1. Once genkit has started running, close and re-open the web preview.

### Additional Information

This app is not an officially supported Google Product.

## Run the app locally using Nix

WIP, but would look something close to this:

```sh
nix-shell ./.idx/dev.nix
```

```sh
npm run --prefix proxy dev -- --host 0.0.0.0 --port 8080
```

## Run the app locally (without Nix)

Setup local Postgres on a Linux machine:

```sh
curl -o local.zip 'https://firebasestorage.googleapis.com/v0/b/yt-rag.appspot.com/o/genkit%2Flocal.zip?alt=media&token=2f1d181d-9eda-4dc1-9ffc-e988f69c26f2'
unzip local.zip -d .
```

Then run in different terminals:

### Postgres and Firebase Emulator

Run:

```sh
rm ./local/postmaster.pid
postgres -D ./local -k /tmp
```

or use a remote instance and update your Genkit and Firebase Emulator configs with correct `postgresql://` connection string.

Next click on the Firebase side bar icon to open the Firebase side bar panel. Click the "Start emulator" button to run the Data Connect emulator.

### Flutter

```sh
flutter run --machine -d web-server --web-hostname 0.0.0.0 --web-port 6789
```

### Genkit

```sh
export GOOGLE_GENAI_API_KEY=$YOUR_API_KEY
cd genkit
npm i
npx genkit start
```

### Web frontend

```sh
cd proxy
npm i
npm run --prefix proxy dev -- --host 0.0.0.0 --port 8080
```

Open <http://localhost:8080> in your browser.
