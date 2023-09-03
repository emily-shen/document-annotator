#!/bin/bash

npx prisma migrate reset
npx prisma db push
npx prisma db seed
npm run dev