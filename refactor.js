const fs = require('fs');

let content = fs.readFileSync('components/TeacherDashboardComponent.js', 'utf8');

const regex = /<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">([\s\S]*?){\/\* Passcode Modal \*\/}/;
const match = content.match(regex);

if (!match) {
    console.error("Match not found");
    process.exit(1);
}

const middlePart = match[1];

const extractBlock = (startString, endString) => {
    const start = middlePart.indexOf(startString);
    let end;
    if (endString) {
        end = middlePart.indexOf(endString, start);
    } else {
        end = middlePart.lastIndexOf('</div>\n      </div>');
        if (end === -1) end = middlePart.lastIndexOf('</div>\r\n      </div>');
    }
    return middlePart.substring(start, end).trim();
};

const overviewBlock = extractBlock('{/* Attendance Overview */}', '{/* Live Check-Ins */}');
let liveBlock = extractBlock('{/* Live Check-Ins */}', '</div>\n        <div className="space-y-8">');
if (!liveBlock) liveBlock = extractBlock('{/* Live Check-Ins */}', '</div>\r\n        <div className="space-y-8">');
if (!liveBlock) liveBlock = extractBlock('{/* Live Check-Ins */}', '</div>');
const exceptionsBlock = extractBlock('{/* Exception Requests */}', '{/* Sidebar */}');
const classesBlock = extractBlock('{/* Today\'s Schedule */}', '{/* Quick Actions */}');
const actionsBlock = extractBlock('{/* Quick Actions */}', '{/* Security Status */}');
let statusBlock = extractBlock('{/* Security Status */}', '</div>\n        </div>\n      </div>');
if (!statusBlock) statusBlock = extractBlock('{/* Security Status */}', '</div>\r\n        </div>\r\n      </div>');
if (!statusBlock) statusBlock = extractBlock('{/* Security Status */}');
// Cleanup statusBlock if it contains extra closing tags
statusBlock = statusBlock.replace(/<\/div>\s*<\/div>\s*<\/div>$/, '');

// Build the new ResponsiveGridLayout structure
const newStructure = `
      {/* Layout Controls */}
      <div className="flex justify-end space-x-3 mb-4">
        {isEditMode && (
          <button
            onClick={resetLayout}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors border border-red-500/30 text-sm font-medium"
          >
            Reset Layout
          </button>
        )}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-colors border border-blue-500/30 text-sm font-medium flex items-center gap-2"
        >
          {isEditMode ? <CheckCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {isEditMode ? "Save Layout" : "Customize Layout"}
        </button>
      </div>

      {!mounted ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout -mx-3"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[24, 24]}
          useCSSTransforms={true}
        >
          <div key="overview" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${overviewBlock.replace(/bg-card\/40/g, 'bg-card/40 h-full overflow-y-auto')}
          </div>
          <div key="live" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${liveBlock}
          </div>
          <div key="exceptions" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${exceptionsBlock}
          </div>
          <div key="classes" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${classesBlock.replace(/bg-card\/40/g, 'bg-card/40 h-full overflow-y-auto')}
          </div>
          <div key="actions" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${actionsBlock.replace(/bg-card\/40/g, 'bg-card/40 h-full overflow-y-auto')}
          </div>
          <div key="status" className={\`\${isEditMode ? 'cursor-move ring-2 ring-blue-500 rounded-2xl' : ''}\`}>
            ${statusBlock.replace(/bg-card\/40/g, 'bg-card/40 h-full overflow-y-auto')}
          </div>
        </ResponsiveGridLayout>
      )}

      `;

const finalContent = content.replace(regex, newStructure + '{/* Passcode Modal */}');

fs.writeFileSync('components/TeacherDashboardComponent.js', finalContent);
console.log("Successfully refactored dashboard");
