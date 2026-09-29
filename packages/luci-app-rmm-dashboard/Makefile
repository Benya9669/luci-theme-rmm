# SPDX-License-Identifier: MIT
include $(TOPDIR)/rules.mk

LUCI_TITLE:=OpenWrt RMM router dashboard
LUCI_DEPENDS:=+luci-base +luci-mod-status
LUCI_PKGARCH:=all
LUCI_DESCRIPTION:=Read-only router and RMM agent overview for LuCI.

PKG_NAME:=luci-app-rmm-dashboard
PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(TOPDIR)/feeds/luci/luci.mk

# scan.mk greps for a literal `call BuildPackage`, keep as anchor
$(eval $(call BuildPackage,$(PKG_NAME)))
