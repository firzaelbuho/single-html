1. List Members

- Endpoint : https://jkt48.com/api/v1/members?lang=id

- Response : {
  "status": true,
  "message": "Berhasil mendapatkan data",
  "data": [
    {
      "type": "PASSION",
      "code": "ABIGAIL_RACHEL",
      "name": "Abigail Rachel",
      "nickname": "Aralie",
      "photo": "https://jkt48.com/api/v1/storages/media/jkt48-member/abigail_rachel.jpg",
      "jkt48_member_id": 1
    }
  ]
}



2. Member Detail 

- Endpoint : https://jkt48.com/api/v1/members/[jkt48_member_id]?lang=id
- Response : {
  "status": true,
  "message": "Berhasil mendapatkan data",
  "data": {
    "type": "PASSION",
    "code": "ABIGAIL_RACHEL",
    "name": "Abigail Rachel",
    "nickname": "Aralie",
    "photo": "media/jkt48-member/abigail_rachel.jpg",
    "birth_place": "",
    "birth_date": "2008-08-05T17:00:00.000Z",
    "blood_type": "B",
    "body_height": "164",
    "horoscope": "Leo",
    "twitter_account": "Aralie_JKT48",
    "instagram_account": "jkt48.aralie",
    "tiktok_account": "jkt48.aralie",
    "youtube_profile_movie": "",
    "photo_1": "https://jkt48.com/api/v1/storages/media/jkt48-member/abigail_rachel.jpg",
    "photo_2": "https://jkt48.com/api/v1/storages/media/jkt48-member/abigail_rachel.jpg",
    "photo_3": ""
  }
}

3. Schedule 

- Endpoint : https://jkt48.com/api/v1/schedules?lang=id&month=4&year=2026

- Response : {
    "status": true,
    "message": "Berhasil mendapatkan data",
    "data": [
        {
            "link": "sh8cd7-pertaruhan-cinta",
            "schedule_id": 7071,
            "date": "2026-03-31T17:00:00.000Z",
            "start_time": "19:00:00",
            "end_time": "21:00:00",
            "type": "SHOW",
            "status": true,
            "content_body": "",
            "short_description": "",
            "title": "Pertaruhan Cinta",
            "jkt48_member_type": "JKT48",
            "birthday_member": null,
            "reference_code": "SH8CD7"
        },
        {
            "link": "sh5e85-pertaruhan-cinta",
            "schedule_id": 7072,
            "date": "2026-04-03T17:00:00.000Z",
            "start_time": "16:00:00",
            "end_time": "18:00:00",
            "type": "SHOW",
            "status": true,
            "content_body": "",
            "short_description": "",
            "title": "Pertaruhan Cinta",
            "jkt48_member_type": "JKT48",
            "birthday_member": "BIRTHDAY",
            "reference_code": "SH5E85"
        }
    ]
}











OTHERS

- Endpoint : year=2026

- Response :