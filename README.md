# Appointment Searcher Service
This project was built to help me schedule a COVID-19 vaccine appointment for my 88 year old mother. The scheduling service I was using was a 3rd party generic scheduling system and it was up to me to sit in front of the computer and press the refresh button hoping an open appointment slot would appear. Even if I was lucky enough to find an open appointment slot I had to be the first one to click the button, fill out the form, and submit it before someone else somewhere did the same thing. It was super frustrating!

Sitting in front of your computer pressing the refresh button is a classic mundane repetitive task that needed to be optimized with the help of a computer. This project is simple. It queries the appointment service web page and then looks for an open appointment slot. It does this over and over until you tell it to stop. If it finds an open appointment slot on the web page it notifies you with a sound. That's it. There is nothing nefarious or "back door" about this. It is exactly as if you were pressing the refresh button yourself.

## Architecture
This project is setup as a classic micro-service/web client architecture. It didn't need to be but oh well - maybe someone will want to build a service with this... That being said I also included support to wrap the entire thing up in to a Docker image so it is very portable to deploy/run anywhere.

This project is the micro-service. It includes the pre-built webpack bundles for the React web client in the `./client_dist` directory. However, if you want to modify/build your own web client you can download the [companion web client project from Github](https://github.com/sseiber/appointment-searcher-client). You can also run the service alone with the `STAND_ALONE` environment variable set to `"1"` if you want to just stare at the log output.

While this project was written to parse a specific 3rd party scheduling service it is not a stretch to imagine abstracting the web parsing method into a library and supporting a "plug in" architecture. This exercise is left to anyone who wants to take it on.

## Dependencies
* VS Code - you really should be using this
* Node (v14+) - the language
* Typescript - because I think type safety is necessary
* Docker - if you want to build/run the Docker container

## Install
```
git clone https://github.com/sseiber/appointment-searcher-service

cd appointment-searcher-service

npm i
```
The `postinstall` script will create a `./configs` directory. If you are going to build the Docker container modify the `imageConfig.json` file to include the platform and the image name (minus the tag). This directory will be ignored from git.

Example:
```
{
    "arch": "amd64",
    "imageName": "mystuff.azurecr.io/appointment-searcher-service"
}
```

## Configuration
The only other thing you need to provide is a `config.json` file which contains the endpoints and other information to use for searching the web page. I won't document specific URLs here since they can change and also since I don't want to call attention to any specific service with this automated tool. You can inspect the code yourself and see what specific endpoint information needs to be provided.

The format of the config should be:
```
{
    "searchEndpoints": [
        {
            "id": "<some identifier you invent>",
            "name": "<readable name for display of the endpoint>",
            "description": "<for completeness>",
            "endpoint": "<the actual endpoint that you browse to in order to see open appointments>"
        },
        ...
    ]
}
```

The service finds the config file under the path `<app storage directory>/storage/config.json`. You need to supply an environment variable `APP_STORAGE` that points to the directory that contains the config file. The service will read this file at startup.

## Run
Press F5 to build the project and run. You should see log output indicating that the configuration was read and it is cycling through each of the configured endpoints looking for open appointment slots. (This is assuming you set the `STAND_ALONE` environment variable to `"1"` in the `launch.json` configuration. )

For an even better experience run the React web client against this service (don't set the `STAND_ALONE` enviroment variable...). The pre-built verson is in the `./client_dist` directory and this micro-service will serve up static content (e.g. the React app) from that directory. The service will run on port 9072 (unless you modified it). With the service running navigate your browser to [http://localhost:9072](http://localhost:9072) and you will see the web client experience.

Click the "Get Started" button and you will see a checkbox for each of the endpoints you configured in the config file. Select one of the endpoints and it will display a card indicating that it is retrieving appointment data and displaying the results.

![Selected endpoint](/docs/running.jpeg)

The results with either be "No appointments found" or it will be a list of appointments with a button enabled to launch a web page to site it was using. The scanning is paused when an appointment is found so you will need to press the "Resume" button to continue.

<img alt="Open appointment found" src="https://github.com/sseiber/appointment-searcher-service/blob/master/docs/appointment.jpeg" width="600">

At this point you are on your own. As I said, there is no "back door" functionality with this tool. It simply automates the process of looking for open appointments and then gives control back to you to select the appointment yourself, register, and submit. Maybe a future improvement is needed here. 😉

## Build Docker Container
If you want to build the docker container make sure you configured the `./configs/imageConfig.json` file. There is a built-in npm script to build the docker image. It will use the version number in your `package.json` file as well as the architecture you specified in the imageConfig file as your tag. Build the Docker container with this command:
```
npm run dockerbuild
```
When this command completes you will have a containerized version of the project. You can run the container with this example command:
```
docker run \
	-it \
	--rm \
	-p 9072:9072 \
	-v <path to directory containing your config file>:/data \
iotccrscotts.azurecr.io/appointment-searcher-service:1.0.0-amd64
```
This command will:
* Run the docker file (`docker run`)
  * interactively on the command line (`-it`)
  * remove the running container after you quick (`--rm`)
  * map local port 9072 to internal docker container port 9072 (`-p 9072:9072`)
  * map your local directory containing your config file to the internal docker container directory `/data` (`-v <path>:/data`)
  * with image name

## Conclusion
I hope you find this tool useful to help yourself and help you help others who are less technically inclined to access the appointment services in order to received their COVID vaccinations.

Stay safe, mask up, and stay healthy!
