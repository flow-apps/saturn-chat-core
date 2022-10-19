# (CHANGELOG) Saturn Chat Core

For each update, modify this changelog (newest to older) with a subsequent version number.

## 0.0.17

- Add handling error for OneSignal Notification
- Add feature for revoke invalid Notification User IDs
- Add required data in notification body
- Fix bugs

## 0.0.16

- Fix user notifications register
- Refactor user notification routes
- Fix notification of text messages
- Add validation in Notification Service
- Remove default segment in Notification Service

## 0.0.15

- Add OneSignal Notifications
- Refactor Notification Service
- Refactor Notification Controller
- Refactor Notifications on Websockets

## 0.0.14

- Remove Remote Config route
- Up the number of chars in filename (20 to 30 random bytes)

## 0.0.13

- Add link preview generator
  - Add field in DB for storage the links info
  - Create utils functions for help generate link infos
- Fix bugs in participant

## 0.0.12

- Invite friends for groups
- Fix kick and ban participants

## 0.0.11

- Remove DM messages of unfriends

## 0.0.10

- Add friends table in database
- Add friends controller
- Remove direct groups from search queries
- Add friend requests
- Add friend responses for requests

## 0.0.9

- Add reply message

## 0.0.8

- Add authorized roles in groups actions
- Fix typing users sockets

## 0.0.7

- Add indicator for sending/sended message
- Better performance in save messages

## 0.0.6

- Add bio for user

## 0.0.5

- Add roles and configure

## 0.0.4

- Add online/offline system

## 0.0.3

- Enable/disable notifications added

## 0.0.2

- Upgrade all libs for versions that not has vulnerabilities

## 0.0.1

- Start Changelog
- Add way to unregister Expo Push Tokens
