class Time {
  timeToMS(time: number, timeType: "seconds" | "hour") {
    switch (timeType) {
      case "seconds":
        return time * 1000
      case "hour":
        return time * 1000 * 60
      default:
        return time * 1000
    }
  }
}

export { Time }
