#!/usr/bin/env node

/**
 * ============================================================================
 * 🚀 MIGRATION CLI (Issue #4225)
 * ============================================================================
 * Command-line interface for running database migrations.
 *
 * Usage:
 *   node scripts/migrate.js [command] [options]
 *
 * Commands:
 *   run          Run pending migrations
 *   status       Show migration status
 *   rollback     Rollback last N migrations
 *   validate     Validate sync health
 *   dry-run      Show what migrations would do
 */

import {
  runMigrations,
  rollbackMigrations,
  getMigrationRunnerStatus,
  registerMigrations,
} from "../lib/migrations/migrationRunner.js";
import migrations from "../lib/migrations/index.js";
import { validateAllCollections, calculateSyncHealthScore } from "../lib/migrations/syncValidator.js";

// Register all migrations
registerMigrations(migrations);

const args = process.argv.slice(2);
const command = args[0] || "status";
const flag = args[1];

async function main() {
  console.log("🔧 Learnova Database Migration Tool\n");

  switch (command) {
    case "run":
    case "migrate": {
      const dryRun = flag === "--dry-run";
      if (dryRun) console.log("📋 DRY RUN MODE - No changes will be applied\n");

      const result = await runMigrations({
        dryRun,
        environment: process.env.NODE_ENV || "development",
      });

      if (result.applied?.length > 0) {
        console.log("✅ Applied migrations:");
        for (const m of result.applied) {
          console.log(`   ${m.id} - ${m.name} ${m.duration ? `(${m.duration}ms)` : ""}`);
        }
      }

      if (result.failed?.length > 0) {
        console.log("\n❌ Failed migrations:");
        for (const m of result.failed) {
          console.log(`   ${m.id} - ${m.name}: ${m.error}`);
        }
      }

      if (result.message) {
        console.log(`ℹ️  ${result.message}`);
      }
      break;
    }

    case "status": {
      const status = await getMigrationRunnerStatus();
      console.log(`Environment: ${status.environment}`);
      console.log(`Total registered: ${status.totalRegistered}`);
      console.log(`Applied: ${status.totalApplied}`);
      console.log(`Failed: ${status.totalFailed}`);

      if (status.pending?.length > 0) {
        console.log("\n⏳ Pending migrations:");
        for (const m of status.pending) {
          console.log(`   ${m.id} - ${m.name}`);
        }
      }

      if (status.migrations?.length > 0) {
        console.log("\n📜 Migration history:");
        for (const m of status.migrations) {
          const icon = m.status === "success" ? "✅" : "❌";
          console.log(`   ${icon} ${m.migrationId} - ${m.name} (${m.duration || 0}ms)`);
        }
      }
      break;
    }

    case "rollback": {
      const count = parseInt(flag) || 1;
      console.log(`Rolling back ${count} migration(s)...\n`);

      const result = await rollbackMigrations(count);

      if (result.applied?.length > 0) {
        console.log("✅ Rolled back:");
        for (const m of result.applied) {
          console.log(`   ${m.id} - ${m.name}`);
        }
      }

      if (result.failed?.length > 0) {
        console.log("\n❌ Rollback failed:");
        for (const m of result.failed) {
          console.log(`   ${m.id} - ${m.name}: ${m.error}`);
        }
      }
      break;
    }

    case "validate": {
      console.log("🔍 Validating sync health...\n");

      const results = await validateAllCollections();
      const healthScore = calculateSyncHealthScore(results.results);

      console.log(`Health Score: ${healthScore}/100\n`);

      for (const result of results.results) {
        const icon =
          result.status === "consistent"
            ? "✅"
            : result.status === "minor_issues"
            ? "⚠️"
            : "❌";
        console.log(`${icon} ${result.collection}: ${result.status}`);
        console.log(`   Firestore: ${result.firestoreCount} docs`);
        console.log(`   MongoDB: ${result.mongodbCount} docs`);
        if (result.issues?.length > 0) {
          for (const issue of result.issues) {
            console.log(`   ⚠️  ${issue}`);
          }
        }
      }
      break;
    }

    case "dry-run": {
      console.log("📋 DRY RUN MODE - No changes will be applied\n");
      const result = await runMigrations({
        dryRun: true,
        environment: process.env.NODE_ENV || "development",
      });

      if (result.applied?.length > 0) {
        console.log("Would apply:");
        for (const m of result.applied) {
          console.log(`   ${m.id} - ${m.name}`);
          if (m.affectedCollections) {
            console.log(`     Firestore: ${m.affectedCollections.firestore?.join(", ") || "none"}`);
            console.log(`     MongoDB: ${m.affectedCollections.mongodb?.join(", ") || "none"}`);
          }
        }
      }
      break;
    }

    default:
      console.log("Usage: node scripts/migrate.js [command]");
      console.log("\nCommands:");
      console.log("  run [--dry-run]   Run pending migrations");
      console.log("  status            Show migration status");
      console.log("  rollback [N]      Rollback last N migrations");
      console.log("  validate          Validate sync health");
      console.log("  dry-run           Preview migrations");
      break;
  }
}

main().catch((error) => {
  console.error("Migration error:", error);
  process.exit(1);
});
