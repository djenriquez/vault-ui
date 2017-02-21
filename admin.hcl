{
  "path": {
    "*": {
      "capabilities": [
        "create",
        "read",
        "update",
        "delete",
        "list",
        "sudo"
      ]
    },
    "ultrasecret/admincantlistthis/": {
      "capabilities": [
        "deny"
      ]
    },
    "ultrasecret/admincantreadthis": {
      "capabilities": [
        "deny"
      ]
    }
  }
}
