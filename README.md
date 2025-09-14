Basis is an AI-assisted knowledge base that supports organization and analysis of information and facilitates context sharing for LLMs and agentic usages. It not only centralizes storage of information but also provides management and guidance on turning it into actionable steps, pertaining to various use cases such as medical records tracking and immigration applications.  By dividing the software into three modules—-vault, import, and apps--Basis allows user to easily input their information and securely port the information to 3rd party LLMs as context and provide functionalities such as scheduling meetings and creating databases in Notion or other external apps.

Technical overview:
A full-stack application with a Python Flask backend and a React/TypeScript frontend built with Vite and Electron for desktop deployment. 

How to start it:

- run `npm i`
- run `npx tsc -p electron/tsconfig.json`
- in one terminal window, run the server with `python backend/server.py`
- in another, run the frontend with `npm run dev` (after cd-ing into frontend)
