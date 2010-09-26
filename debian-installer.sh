#!/bin/bash
# Author : Victor Mishel Vera Sanchez <moonsadly@gmail.com>
# Site : www.ktrionix-labs.comlu.com
#
#   Copyright (c) 2010, mishudark.  This file is
#   licensed under the General Public License version 3.

#Check if the user has super privileges
if [[ $EUID -ne 0 ]]; then
echo You need super privileges 
    exit 1
fi

echo "Installing extra packages ..."
apt-get install python-webkit python-notify python-keybinder python-distutils-extra
python setup.py build && python setup.py install --install-layout deb
