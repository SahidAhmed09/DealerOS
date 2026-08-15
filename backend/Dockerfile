FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend
COPY DealerOS_Assignment_Dataset DealerOS_Assignment_Dataset

WORKDIR /app/backend

EXPOSE 8000

# Fresh database every start: migrate builds the schema, import_data loads
# the three CSVs, reconcile computes the disagreements - the same sequence
# the README has a person run by hand, just automated for a container.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py import_data && python manage.py reconcile && python manage.py runserver 0.0.0.0:8000"]
