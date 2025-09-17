```mermaid
graph LR
app -->|201| other
app -->|22| components
app -->|126| lib
app -->|43| utils
app -->|29| app
app -->|8| features
other -->|209| other
other -->|81| lib
other -->|12| utils
components -->|133| other
components -->|54| components
components -->|36| lib
components -->|8| features
components -->|4| utils
other -->|6| features
other -->|4| components
features -->|45| lib
features -->|36| features
features -->|87| other
features -->|5| utils
features -->|30| components
features -->|1| app
lib -->|64| lib
lib -->|25| other
lib -->|8| utils
utils -->|3| utils
utils -->|5| other
```