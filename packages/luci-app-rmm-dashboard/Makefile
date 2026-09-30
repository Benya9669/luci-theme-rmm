# SPDX-License-Identifier: MIT
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-rmm-dashboard
PKG_VERSION:=0.2.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-rmm-dashboard
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=OpenWrt RMM router dashboard
  DEPENDS:=+luci-base +luci-mod-status
  PKGARCH:=all
endef

define Package/luci-app-rmm-dashboard/description
  Read-only router and RMM agent overview for LuCI.
endef

define Build/Compile
endef

define Package/luci-app-rmm-dashboard/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/status
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/status/rmm-dashboard.js $(1)/www/luci-static/resources/view/status/rmm-dashboard.js
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/status/rmm-dashboard.css $(1)/www/luci-static/resources/view/status/rmm-dashboard.css
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-rmm-dashboard.json $(1)/usr/share/luci/menu.d/luci-app-rmm-dashboard.json
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-rmm-dashboard.json $(1)/usr/share/rpcd/acl.d/luci-app-rmm-dashboard.json
	$(INSTALL_DIR) $(1)/usr/share/licenses/luci-app-rmm-dashboard
	$(INSTALL_DATA) ./LICENSE $(1)/usr/share/licenses/luci-app-rmm-dashboard/LICENSE
endef

$(eval $(call BuildPackage,luci-app-rmm-dashboard))
