module infini.sh/console

go 1.25.0

replace infini.sh/framework => ../framework

replace github.com/cihub/seelog => ../framework/lib/seelog

require (
	github.com/Knetic/govaluate v3.0.0+incompatible
	github.com/buger/jsonparser v1.2.0
	github.com/crewjam/saml v0.5.1
	github.com/emirpasic/gods v1.18.1
	github.com/golang-jwt/jwt/v4 v4.5.2
	github.com/gomarkdown/markdown v0.0.0-20260417124207-7d523f7318df
	github.com/google/go-github v17.0.0+incompatible
	github.com/mitchellh/mapstructure v1.5.0
	github.com/r3labs/diff/v2 v2.15.1
	github.com/segmentio/encoding v0.5.4
	github.com/stretchr/testify v1.11.1
	golang.org/x/crypto v0.52.0
	golang.org/x/oauth2 v0.36.0
	gopkg.in/gomail.v2 v2.0.0-20160411212932-81ebce5c23df
	gopkg.in/yaml.v2 v2.4.0
)

require (
	github.com/beevik/etree v1.5.0 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/google/go-cmp v0.7.0 // indirect
	github.com/google/go-querystring v1.1.0 // indirect
	github.com/jonboulle/clockwork v0.2.2 // indirect
	github.com/mattermost/xml-roundtrip-validator v0.1.0 // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/russellhaering/goxmldsig v1.4.0 // indirect
	github.com/segmentio/asm v1.1.3 // indirect
	github.com/vmihailenco/msgpack v4.0.4+incompatible // indirect
	golang.org/x/net v0.54.0 // indirect
	golang.org/x/sys v0.45.0 // indirect
	google.golang.org/appengine v1.6.6 // indirect
	google.golang.org/protobuf v1.36.6 // indirect
	gopkg.in/alexcesaro/quotedprintable.v3 v3.0.0-20150716171945-2caba252f4dc // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
