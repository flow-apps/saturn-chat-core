export const converterStringWithType = (value: any, type: string): any => {
  switch (type) {
    case "boolean":
      return value === "true"

    case "number":
      return Number(value)

    case "string":
      return String(value)
  
    default:
      return String(value);
  }
}