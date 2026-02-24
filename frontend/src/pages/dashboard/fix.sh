#!/bin/bash

# Fix Marketing.jsx - remove line 280 which has extra )}
sed -i '280d' Marketing.jsx

# Fix PackagesMemberships.jsx - remove line 199 which has extra )}
sed -i '199d' PackagesMemberships.jsx

echo "Fixes applied!"
