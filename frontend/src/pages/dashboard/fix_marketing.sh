#!/bin/bash

# Fix Marketing.jsx - the key issue is missing </div> before the campaigns && closing
# We need to add </div> after line 279 to close the p-6 div
# Original pattern around line 277-282:
#  267  </table>
#  278  )}
#  279  </div>
#  280  )}
#  281  </div>
#  282  );

# The issue: After the ternary closes (278), we need to close the p-6 div (279), 
#            then the campaigns-specific bg-zinc-900 box (should be 280),
#            then close the campaigns && (281),
#            then could be another </div>

# Current state seems to be missing a </div> in the right place
# Let's insert it at the right location

# First, find and replace the exact section
perl -i -0pe 's|            \)\}\n        <\/div>\n      \)\}\n    <\/div>|            )\}\n        <\/div>\n      <\/div>\n      )}\n    <\/div>|' Marketing.jsx

echo "Fixed Marketing.jsx"
