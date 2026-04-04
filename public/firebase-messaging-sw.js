importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')
firebase.initializeApp({
  apiKey:            'YOUR_KEY',
  authDomain:        'YOUR_DOMAIN',
  projectId:         'YOUR_PROJECT',
  storageBucket:     'YOUR_BUCKET',
  messagingSenderId: 'YOUR_SENDER',
  appId:             'YOUR_APP_ID',
})
const messaging = firebase.messaging()
messaging.onBackgroundMessage(payload => {
  const { title='Qrownd', body='New notification' } = payload.notification || {}
  self.registration.showNotification(title, { body, icon:'/favicon.ico', badge:'/favicon.ico' })
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.link || '/'))
})
