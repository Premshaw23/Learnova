import os
import re

for root, dirs, files in os.walk('node_modules'):
    if 'workbox-build' in root or 'workbox-webpack-plugin' in root:
        for f in files:
            if f.endswith('.js'):
                path = os.path.join(root, f)
                try:
                    content = open(path, encoding='utf-8').read()
                    matches = re.findall(r'.{0,50}import \{.{0,50}', content)
                    for m in matches:
                        if 'as' in m and 'from' in m:
                            print(path, ":", m)
                except:
                    pass
