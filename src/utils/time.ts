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

  formatTime(millis: number) {
    let seconds = millis / 1000;

    const hours = String(Math.trunc(seconds / 3600));
    seconds = seconds % 3600;

    const minutes = String(Math.trunc(seconds / 60));
    seconds = Math.trunc(seconds % 60)

    return `${minutes.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  }
}

export { Time }
