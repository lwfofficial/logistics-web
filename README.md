#Local World Forwarders
#
##Backend

- Django 
- Django Rest Framework

### Setup ambiente di sviluppo

- installare il pacchetto virtualenv: *sudo apt-get install virtualenv*
- Clonare il progetto da Bitbucket ed eseguire i comandi da shell
- cd *path_to_git*
- git checkout development
- virtualenv environment
- source environment/bin/activate
- pip install -r requirements.txt
- python server/manage.py makemigrations
- python server/manage.py migrate
- python server/manage.py runserver


##Frontend

- Angular 5
- Angular Material

### Setup ambiente di sviluppo

- dopo aver clonato il progetto da Bitbucket
- cd *path_to_git*
- cd frontend
- git checkout development
- npm install
- npm run start
