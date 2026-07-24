---
title: CLI Reference
sidebar_position: 3
---

This documentation is for the `up` CLI v0.52.0.

The latest version of `up` can be installed by running:

```shell
curl -sL "https://cli.upbound.io" | sh
```

import Up from '/cli/up.md';
import UpCompletion from '/cli/up_completion.md';
import UpComposition from '/cli/up_composition.md';
import UpCompositionGenerate from '/cli/up_composition_generate.md';
import UpCompositionRender from '/cli/up_composition_render.md';
import UpConfig from '/cli/up_config.md';
import UpConfigGet from '/cli/up_config_get.md';
import UpConfigSet from '/cli/up_config_set.md';
import UpControlplane from '/cli/up_controlplane.md';
import UpControlplaneAddOn from '/cli/up_controlplane_add-on.md';
import UpControlplaneAddOnInstall from '/cli/up_controlplane_add-on_install.md';
import UpControlplaneConfiguration from '/cli/up_controlplane_configuration.md';
import UpControlplaneConfigurationInstall from '/cli/up_controlplane_configuration_install.md';
import UpControlplaneConnector from '/cli/up_controlplane_connector.md';
import UpControlplaneConnectorInstall from '/cli/up_controlplane_connector_install.md';
import UpControlplaneConnectorUninstall from '/cli/up_controlplane_connector_uninstall.md';
import UpControlplaneCreate from '/cli/up_controlplane_create.md';
import UpControlplaneDelete from '/cli/up_controlplane_delete.md';
import UpControlplaneFunction from '/cli/up_controlplane_function.md';
import UpControlplaneFunctionInstall from '/cli/up_controlplane_function_install.md';
import UpControlplaneGet from '/cli/up_controlplane_get.md';
import UpControlplaneList from '/cli/up_controlplane_list.md';
import UpControlplaneMigration from '/cli/up_controlplane_migration.md';
import UpControlplaneMigrationExport from '/cli/up_controlplane_migration_export.md';
import UpControlplaneMigrationImport from '/cli/up_controlplane_migration_import.md';
import UpControlplaneMigrationPauseToggle from '/cli/up_controlplane_migration_pause-toggle.md';
import UpControlplaneOidcAuth from '/cli/up_controlplane_oidc-auth.md';
import UpControlplaneOidcAuthAws from '/cli/up_controlplane_oidc-auth_aws.md';
import UpControlplaneProvider from '/cli/up_controlplane_provider.md';
import UpControlplaneProviderInstall from '/cli/up_controlplane_provider_install.md';
import UpControlplanePullSecret from '/cli/up_controlplane_pull-secret.md';
import UpControlplanePullSecretCreate from '/cli/up_controlplane_pull-secret_create.md';
import UpControlplaneSimulate from '/cli/up_controlplane_simulate.md';
import UpControlplaneSimulation from '/cli/up_controlplane_simulation.md';
import UpControlplaneSimulationCreate from '/cli/up_controlplane_simulation_create.md';
import UpControlplaneSimulationDelete from '/cli/up_controlplane_simulation_delete.md';
import UpControlplaneSimulationList from '/cli/up_controlplane_simulation_list.md';
import UpCtx from '/cli/up_ctx.md';
import UpDependency from '/cli/up_dependency.md';
import UpDependencyAdd from '/cli/up_dependency_add.md';
import UpDependencyCleanCache from '/cli/up_dependency_clean-cache.md';
import UpDependencyList from '/cli/up_dependency_list.md';
import UpDependencyTree from '/cli/up_dependency_tree.md';
import UpDependencyUpdateCache from '/cli/up_dependency_update-cache.md';
import UpExample from '/cli/up_example.md';
import UpExampleGenerate from '/cli/up_example_generate.md';
import UpFunction from '/cli/up_function.md';
import UpFunctionGenerate from '/cli/up_function_generate.md';
import UpGroup from '/cli/up_group.md';
import UpGroupCreate from '/cli/up_group_create.md';
import UpGroupDelete from '/cli/up_group_delete.md';
import UpGroupGet from '/cli/up_group_get.md';
import UpGroupList from '/cli/up_group_list.md';
import UpHelp from '/cli/up_help.md';
import UpLicense from '/cli/up_license.md';
import UpLogin from '/cli/up_login.md';
import UpLogout from '/cli/up_logout.md';
import UpOperation from '/cli/up_operation.md';
import UpOperationGenerate from '/cli/up_operation_generate.md';
import UpOperationRender from '/cli/up_operation_render.md';
import UpOrganization from '/cli/up_organization.md';
import UpOrganizationCreate from '/cli/up_organization_create.md';
import UpOrganizationDelete from '/cli/up_organization_delete.md';
import UpOrganizationGet from '/cli/up_organization_get.md';
import UpOrganizationList from '/cli/up_organization_list.md';
import UpOrganizationToken from '/cli/up_organization_token.md';
import UpOrganizationUser from '/cli/up_organization_user.md';
import UpOrganizationUserInvite from '/cli/up_organization_user_invite.md';
import UpOrganizationUserList from '/cli/up_organization_user_list.md';
import UpOrganizationUserRemove from '/cli/up_organization_user_remove.md';
import UpProfile from '/cli/up_profile.md';
import UpProfileCreate from '/cli/up_profile_create.md';
import UpProfileCurrent from '/cli/up_profile_current.md';
import UpProfileDelete from '/cli/up_profile_delete.md';
import UpProfileList from '/cli/up_profile_list.md';
import UpProfileRename from '/cli/up_profile_rename.md';
import UpProfileSet from '/cli/up_profile_set.md';
import UpProfileUse from '/cli/up_profile_use.md';
import UpProfileView from '/cli/up_profile_view.md';
import UpProject from '/cli/up_project.md';
import UpProjectAi from '/cli/up_project_ai.md';
import UpProjectAiConfigureTools from '/cli/up_project_ai_configure-tools.md';
import UpProjectBuild from '/cli/up_project_build.md';
import UpProjectInit from '/cli/up_project_init.md';
import UpProjectMove from '/cli/up_project_move.md';
import UpProjectPush from '/cli/up_project_push.md';
import UpProjectRun from '/cli/up_project_run.md';
import UpProjectSimulate from '/cli/up_project_simulate.md';
import UpProjectSimulation from '/cli/up_project_simulation.md';
import UpProjectSimulationComplete from '/cli/up_project_simulation_complete.md';
import UpProjectSimulationCreate from '/cli/up_project_simulation_create.md';
import UpProjectSimulationDelete from '/cli/up_project_simulation_delete.md';
import UpProjectStop from '/cli/up_project_stop.md';
import UpProjectUpgrade from '/cli/up_project_upgrade.md';
import UpRepository from '/cli/up_repository.md';
import UpRepositoryCreate from '/cli/up_repository_create.md';
import UpRepositoryDelete from '/cli/up_repository_delete.md';
import UpRepositoryGet from '/cli/up_repository_get.md';
import UpRepositoryList from '/cli/up_repository_list.md';
import UpRepositoryPermission from '/cli/up_repository_permission.md';
import UpRepositoryPermissionGrant from '/cli/up_repository_permission_grant.md';
import UpRepositoryPermissionList from '/cli/up_repository_permission_list.md';
import UpRepositoryPermissionRevoke from '/cli/up_repository_permission_revoke.md';
import UpRepositoryUpdate from '/cli/up_repository_update.md';
import UpResource from '/cli/up_resource.md';
import UpResourceCount from '/cli/up_resource_count.md';
import UpRobot from '/cli/up_robot.md';
import UpRobotCreate from '/cli/up_robot_create.md';
import UpRobotDelete from '/cli/up_robot_delete.md';
import UpRobotGet from '/cli/up_robot_get.md';
import UpRobotList from '/cli/up_robot_list.md';
import UpRobotTeam from '/cli/up_robot_team.md';
import UpRobotTeamJoin from '/cli/up_robot_team_join.md';
import UpRobotTeamLeave from '/cli/up_robot_team_leave.md';
import UpRobotTeamList from '/cli/up_robot_team_list.md';
import UpRobotToken from '/cli/up_robot_token.md';
import UpRobotTokenCreate from '/cli/up_robot_token_create.md';
import UpRobotTokenDelete from '/cli/up_robot_token_delete.md';
import UpRobotTokenGet from '/cli/up_robot_token_get.md';
import UpRobotTokenList from '/cli/up_robot_token_list.md';
import UpSpace from '/cli/up_space.md';
import UpSpaceBilling from '/cli/up_space_billing.md';
import UpSpaceBillingExport from '/cli/up_space_billing_export.md';
import UpSpaceBillingReport from '/cli/up_space_billing_report.md';
import UpSpaceBillingReportUpdate from '/cli/up_space_billing_report_update.md';
import UpSpaceConnect from '/cli/up_space_connect.md';
import UpSpaceDestroy from '/cli/up_space_destroy.md';
import UpSpaceDisconnect from '/cli/up_space_disconnect.md';
import UpSpaceInit from '/cli/up_space_init.md';
import UpSpaceLicense from '/cli/up_space_license.md';
import UpSpaceLicenseApply from '/cli/up_space_license_apply.md';
import UpSpaceLicenseRemove from '/cli/up_space_license_remove.md';
import UpSpaceLicenseShow from '/cli/up_space_license_show.md';
import UpSpaceList from '/cli/up_space_list.md';
import UpSpaceMirror from '/cli/up_space_mirror.md';
import UpSpaceUpgrade from '/cli/up_space_upgrade.md';
import UpSupportBundle from '/cli/up_support-bundle.md';
import UpSupportBundleCollect from '/cli/up_support-bundle_collect.md';
import UpSupportBundleServe from '/cli/up_support-bundle_serve.md';
import UpSupportBundleTemplate from '/cli/up_support-bundle_template.md';
import UpTeam from '/cli/up_team.md';
import UpTeamCreate from '/cli/up_team_create.md';
import UpTeamDelete from '/cli/up_team_delete.md';
import UpTeamGet from '/cli/up_team_get.md';
import UpTeamList from '/cli/up_team_list.md';
import UpTest from '/cli/up_test.md';
import UpTestGenerate from '/cli/up_test_generate.md';
import UpTestRun from '/cli/up_test_run.md';
import UpToken from '/cli/up_token.md';
import UpTokenCreate from '/cli/up_token_create.md';
import UpTokenDelete from '/cli/up_token_delete.md';
import UpTokenGet from '/cli/up_token_get.md';
import UpTokenList from '/cli/up_token_list.md';
import UpUxp from '/cli/up_uxp.md';
import UpUxpInstall from '/cli/up_uxp_install.md';
import UpUxpLicense from '/cli/up_uxp_license.md';
import UpUxpLicenseApply from '/cli/up_uxp_license_apply.md';
import UpUxpLicenseRemove from '/cli/up_uxp_license_remove.md';
import UpUxpLicenseShow from '/cli/up_uxp_license_show.md';
import UpUxpUninstall from '/cli/up_uxp_uninstall.md';
import UpUxpUpgrade from '/cli/up_uxp_upgrade.md';
import UpUxpWebUi from '/cli/up_uxp_web-ui.md';
import UpUxpWebUiDisable from '/cli/up_uxp_web-ui_disable.md';
import UpUxpWebUiEnable from '/cli/up_uxp_web-ui_enable.md';
import UpUxpWebUiOpen from '/cli/up_uxp_web-ui_open.md';
import UpVersion from '/cli/up_version.md';
import UpXpkg from '/cli/up_xpkg.md';
import UpXpkgAppend from '/cli/up_xpkg_append.md';
import UpXpkgBatch from '/cli/up_xpkg_batch.md';
import UpXpkgBuild from '/cli/up_xpkg_build.md';
import UpXpkgPush from '/cli/up_xpkg_push.md';
import UpXpkgXpExtract from '/cli/up_xpkg_xp-extract.md';
import UpXpls from '/cli/up_xpls.md';
import UpXplsServe from '/cli/up_xpls_serve.md';
import UpXrd from '/cli/up_xrd.md';
import UpXrdConvert from '/cli/up_xrd_convert.md';
import UpXrdGenerate from '/cli/up_xrd_generate.md';


## up

<Up />
## up completion

<UpCompletion />
## up composition

<UpComposition />
## up composition generate

<UpCompositionGenerate />
## up composition render

<UpCompositionRender />
## up config

<UpConfig />
## up config get

<UpConfigGet />
## up config set

<UpConfigSet />
## up controlplane

<UpControlplane />
## up controlplane add-on

<UpControlplaneAddOn />
## up controlplane add-on install

<UpControlplaneAddOnInstall />
## up controlplane configuration

<UpControlplaneConfiguration />
## up controlplane configuration install

<UpControlplaneConfigurationInstall />
## up controlplane connector

<UpControlplaneConnector />
## up controlplane connector install

<UpControlplaneConnectorInstall />
## up controlplane connector uninstall

<UpControlplaneConnectorUninstall />
## up controlplane create

<UpControlplaneCreate />
## up controlplane delete

<UpControlplaneDelete />
## up controlplane function

<UpControlplaneFunction />
## up controlplane function install

<UpControlplaneFunctionInstall />
## up controlplane get

<UpControlplaneGet />
## up controlplane list

<UpControlplaneList />
## up controlplane migration

<UpControlplaneMigration />
## up controlplane migration export

<UpControlplaneMigrationExport />
## up controlplane migration import

<UpControlplaneMigrationImport />
## up controlplane migration pause-toggle

<UpControlplaneMigrationPauseToggle />
## up controlplane oidc-auth

<UpControlplaneOidcAuth />
## up controlplane oidc-auth aws

<UpControlplaneOidcAuthAws />
## up controlplane provider

<UpControlplaneProvider />
## up controlplane provider install

<UpControlplaneProviderInstall />
## up controlplane pull-secret

<UpControlplanePullSecret />
## up controlplane pull-secret create

<UpControlplanePullSecretCreate />
## up controlplane simulate

<UpControlplaneSimulate />
## up controlplane simulation

<UpControlplaneSimulation />
## up controlplane simulation create

<UpControlplaneSimulationCreate />
## up controlplane simulation delete

<UpControlplaneSimulationDelete />
## up controlplane simulation list

<UpControlplaneSimulationList />
## up ctx

<UpCtx />
## up dependency

<UpDependency />
## up dependency add

<UpDependencyAdd />
## up dependency clean-cache

<UpDependencyCleanCache />
## up dependency list

<UpDependencyList />
## up dependency tree

<UpDependencyTree />
## up dependency update-cache

<UpDependencyUpdateCache />
## up example

<UpExample />
## up example generate

<UpExampleGenerate />
## up function

<UpFunction />
## up function generate

<UpFunctionGenerate />
## up group

<UpGroup />
## up group create

<UpGroupCreate />
## up group delete

<UpGroupDelete />
## up group get

<UpGroupGet />
## up group list

<UpGroupList />
## up help

<UpHelp />
## up license

<UpLicense />
## up login

<UpLogin />
## up logout

<UpLogout />
## up operation

<UpOperation />
## up operation generate

<UpOperationGenerate />
## up operation render

<UpOperationRender />
## up organization

<UpOrganization />
## up organization create

<UpOrganizationCreate />
## up organization delete

<UpOrganizationDelete />
## up organization get

<UpOrganizationGet />
## up organization list

<UpOrganizationList />
## up organization token

<UpOrganizationToken />
## up organization user

<UpOrganizationUser />
## up organization user invite

<UpOrganizationUserInvite />
## up organization user list

<UpOrganizationUserList />
## up organization user remove

<UpOrganizationUserRemove />
## up profile

<UpProfile />
## up profile create

<UpProfileCreate />
## up profile current

<UpProfileCurrent />
## up profile delete

<UpProfileDelete />
## up profile list

<UpProfileList />
## up profile rename

<UpProfileRename />
## up profile set

<UpProfileSet />
## up profile use

<UpProfileUse />
## up profile view

<UpProfileView />
## up project

<UpProject />
## up project ai

<UpProjectAi />
## up project ai configure-tools

<UpProjectAiConfigureTools />
## up project build

<UpProjectBuild />
## up project init

<UpProjectInit />
## up project move

<UpProjectMove />
## up project push

<UpProjectPush />
## up project run

<UpProjectRun />
## up project simulate

<UpProjectSimulate />
## up project simulation

<UpProjectSimulation />
## up project simulation complete

<UpProjectSimulationComplete />
## up project simulation create

<UpProjectSimulationCreate />
## up project simulation delete

<UpProjectSimulationDelete />
## up project stop

<UpProjectStop />
## up project upgrade

<UpProjectUpgrade />
## up repository

<UpRepository />
## up repository create

<UpRepositoryCreate />
## up repository delete

<UpRepositoryDelete />
## up repository get

<UpRepositoryGet />
## up repository list

<UpRepositoryList />
## up repository permission

<UpRepositoryPermission />
## up repository permission grant

<UpRepositoryPermissionGrant />
## up repository permission list

<UpRepositoryPermissionList />
## up repository permission revoke

<UpRepositoryPermissionRevoke />
## up repository update

<UpRepositoryUpdate />
## up resource

<UpResource />
## up resource count

<UpResourceCount />
## up robot

<UpRobot />
## up robot create

<UpRobotCreate />
## up robot delete

<UpRobotDelete />
## up robot get

<UpRobotGet />
## up robot list

<UpRobotList />
## up robot team

<UpRobotTeam />
## up robot team join

<UpRobotTeamJoin />
## up robot team leave

<UpRobotTeamLeave />
## up robot team list

<UpRobotTeamList />
## up robot token

<UpRobotToken />
## up robot token create

<UpRobotTokenCreate />
## up robot token delete

<UpRobotTokenDelete />
## up robot token get

<UpRobotTokenGet />
## up robot token list

<UpRobotTokenList />
## up space

<UpSpace />
## up space billing

<UpSpaceBilling />
## up space billing export

<UpSpaceBillingExport />
## up space billing report

<UpSpaceBillingReport />
## up space billing report update

<UpSpaceBillingReportUpdate />
## up space connect

<UpSpaceConnect />
## up space destroy

<UpSpaceDestroy />
## up space disconnect

<UpSpaceDisconnect />
## up space init

<UpSpaceInit />
## up space license

<UpSpaceLicense />
## up space license apply

<UpSpaceLicenseApply />
## up space license remove

<UpSpaceLicenseRemove />
## up space license show

<UpSpaceLicenseShow />
## up space list

<UpSpaceList />
## up space mirror

<UpSpaceMirror />
## up space upgrade

<UpSpaceUpgrade />
## up support-bundle

<UpSupportBundle />
## up support-bundle collect

<UpSupportBundleCollect />
## up support-bundle serve

<UpSupportBundleServe />
## up support-bundle template

<UpSupportBundleTemplate />
## up team

<UpTeam />
## up team create

<UpTeamCreate />
## up team delete

<UpTeamDelete />
## up team get

<UpTeamGet />
## up team list

<UpTeamList />
## up test

<UpTest />
## up test generate

<UpTestGenerate />
## up test run

<UpTestRun />
## up token

<UpToken />
## up token create

<UpTokenCreate />
## up token delete

<UpTokenDelete />
## up token get

<UpTokenGet />
## up token list

<UpTokenList />
## up uxp

<UpUxp />
## up uxp install

<UpUxpInstall />
## up uxp license

<UpUxpLicense />
## up uxp license apply

<UpUxpLicenseApply />
## up uxp license remove

<UpUxpLicenseRemove />
## up uxp license show

<UpUxpLicenseShow />
## up uxp uninstall

<UpUxpUninstall />
## up uxp upgrade

<UpUxpUpgrade />
## up uxp web-ui

<UpUxpWebUi />
## up uxp web-ui disable

<UpUxpWebUiDisable />
## up uxp web-ui enable

<UpUxpWebUiEnable />
## up uxp web-ui open

<UpUxpWebUiOpen />
## up version

<UpVersion />
## up xpkg

<UpXpkg />
## up xpkg append

<UpXpkgAppend />
## up xpkg batch

<UpXpkgBatch />
## up xpkg build

<UpXpkgBuild />
## up xpkg push

<UpXpkgPush />
## up xpkg xp-extract

<UpXpkgXpExtract />
## up xpls

<UpXpls />
## up xpls serve

<UpXplsServe />
## up xrd

<UpXrd />
## up xrd convert

<UpXrdConvert />
## up xrd generate

<UpXrdGenerate />

