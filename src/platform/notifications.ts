import { isCapacitor, isElectron } from './env'

export interface NotifyOptions {
  title: string
  body: string
}

export async function notify(opts: NotifyOptions) {
  if (isElectron && 'Notification' in window) {
    new Notification(opts.title, { body: opts.body })
    return
  }

  if (isCapacitor) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: opts.title,
            body: opts.body,
            schedule: { at: new Date(Date.now() + 10) },
          },
        ],
      })
      return
    } catch {
      // ignore, fallback to web
    }
  }

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(opts.title, { body: opts.body })
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') new Notification(opts.title, { body: opts.body })
    }
  }
}
