# Recommending Trips with Amadeus

This repository showcases how to use the Trip Purpose Prediction API to determine if the trip is for work or pleasure. If the trip is for leisure, it uses the Travel Recommendations API to suggest future holidays. Otherwise, it uses the Flight Offers Search API to show flight offers.

## Built With

-   Node.js
-   Express
-   Docker
-   Bootstrap
-   HTML
-   JavaScript

## Getting Started

To run this project locally, make sure you have the following:

-   [Docker](https://docs.docker.com/engine/install/) installed on your local machine
-   [Amadeus developer account](https://developers.amadeus.com/register)
-   A code editor such as [VS Code](https://code.visualstudio.com/download) and a web browser such as [Firefox Browser](https://www.mozilla.org/en-US/firefox/new/)

### Obtaining Amadeus Credentials

You need to authenticate requests to the Amadeus API by providing an API key and an API secret. To obtain these credentials, open [My Self-Service Workspace](https://developers.amadeus.com/my-apps) and click the **Create new app** button.

![Clicking the create new app button](https://i.imgur.com/HyWsGSJ.png)

On the "Create new app" form, provide the app name and click **Create**:

![Providing the app details](https://i.imgur.com/WD52wRp.png)

Once the app is created, you will be navigated to the app details page. Here, copy the values of "API Key" and "API Secret". You will use the credentials later:

![Copying the app credentials](https://i.imgur.com/j1pSxMU.png).

### Running the Project

1. Clone the project locally using the command:

    ```bash
    git clone https://github.com/kimanikevin254/amadeus-trip-recommender.git
    ```

2. Build your Docker image using the command:

    ```bash
    docker build -t amadeus-trip-recommender .
    ```

3. Run your application using the command:

    ```bash
    docker run -p 3000:3000 --env-file .env amadeus-trip-recommender
    ```

### Usage

Navigate to `http://localhost:3000` on your web browser and you should see the form that allows you to provide all the required info:

![Providing trip details](https://i.imgur.com/UU0gYRA.png)

Once you have provided all the required info, click the **Search** button and the "Results" accordion will automatically expand with the predicted trip purpose as well as the flight offers or recommended leisure destinations:

Leisure trip:

![Results](https://i.imgur.com/PRDorPl.png)

Business trip:

![Business trip results](https://i.imgur.com/SpNX0Mp.png)
