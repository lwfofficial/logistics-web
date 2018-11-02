#Local World Forwarders

#Backend

Based upon Django vers. 1.11 (folder backend), all confs are in settings.py

- settings.py
-- please fill db confs
-- please fill smtp/email configs
-- please fill google api keys (maps / captcha)
-- please fill paypal api keys (sandbox/live)
-- please setup all static/media file paths

- Recommended to run in a virtualenv
-- enter folder backend, create a virtualenv with: virtualenv environment
-- run "source environment" and then install requirements with pip "pip install -r requirements.txt"
-- run "python server/manage.py makemigrations && python server/manage.py migrate" for init postgresql db.
-- run "python server/manage.py loaddata fixtures/PATH" for all base fixtures
-- run "python server/manage.py collectstatic" to get all static django files
-- run django dev server with "python server/manage.py runserver"


#Frontend

Based upon Angular (folder frontend), all deps are in package.json and all confs are in enviroment.ts files.

- Reccomended npm vers. 6.1.0 
-- run "npm install" for install all deps.
-- check all api keys (google maps / captcha and paypal)
-- run "ng serve"



