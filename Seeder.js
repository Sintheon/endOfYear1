const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const CONFIG = {
  startingId: 100,
  passwordLength: 6,
  inputFile: 'mok.csv',
  outputFile: 'student_bank_accounts.csv'
};

function generatePassword(length) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const all = upper + lower + numbers;
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  for (let i = 3; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

async function main() {
  console.log('Starting CSV-only student account generation...');
  
  try {
    const csvPath = path.resolve(__dirname, CONFIG.inputFile);
    console.log(`Reading from: ${csvPath}`);
    
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    const lines = csvData.split(/\r?\n/);
    const students = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const [fullName, className] = line.split(';');
      if (fullName && className) {
        students.push({
          originalName: fullName.trim(),
          class: className.trim()
        });
      }
    }
    
    console.log(`Parsed ${students.length} total students from CSV`);
    
    const filteredStudents = students.filter(student => 
      student.class.startsWith('IV') || student.class.startsWith('TB2')
    );
    
    console.log(`Filtered to ${filteredStudents.length} students in IV* or TB2* classes`);
    
    filteredStudents.forEach(student => {
      const nameParts = student.originalName.split(' ');
      
      if (nameParts.length === 1) {
        student.formattedName = student.originalName;
      } else if (nameParts.length === 2) {
        student.formattedName = `${nameParts[1]} ${nameParts[0]}`;
      } else if (nameParts.length === 3) {
        const surname = nameParts[0];
        const firstName = nameParts[1];
        const middleName = nameParts[2];
        student.formattedName = `${firstName} ${middleName} ${surname}`;
      } else {
        const surname = nameParts[0];
        const otherNames = nameParts.slice(1).join(' ');
        student.formattedName = `${otherNames} ${surname}`;
      }
    });
    
    console.log('\nName format examples:');
    filteredStudents.slice(0, 5).forEach(student => {
      console.log(`Original: "${student.originalName}" -> Reformatted: "${student.formattedName}"`);
    });
    
    const classCounts = {};
    filteredStudents.forEach(student => {
      classCounts[student.class] = (classCounts[student.class] || 0) + 1;
    });
    
    console.log('Students per class:');
    Object.entries(classCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([className, count]) => {
        console.log(`  ${className}: ${count} students`);
      });
    
    console.log('\nGenerating student accounts...');
    let nextId = CONFIG.startingId;
    const processedStudents = [];
    const dbInsertCommands = [];
    
    for (const student of filteredStudents) {
      const id = nextId++;
      const password = generatePassword(CONFIG.passwordLength);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      processedStudents.push({
        fullName: student.formattedName,
        originalName: student.originalName,
        class: student.class,
        id: id,
        password: password
      });
      
      dbInsertCommands.push(
        `-- ${student.formattedName} (${student.class})\n` +
        `INSERT INTO signIn (userId, playerName, password) VALUES (${id}, '${student.formattedName.replace(/'/g, "''")}', '${hashedPassword}');\n` +
        `INSERT INTO money (userId, balance) VALUES (${id}, 0);\n`
      );
      
      if (processedStudents.length <= 5) {
        console.log(`Generated: ${student.formattedName}, Class ${student.class}, ID: ${id}, Password: ${password}`);
      }
    }
    
    const outputPath = path.resolve(__dirname, CONFIG.outputFile);
    const csvHeader = 'Full Name,Class,ID,Password,Link';
    const csvRows = processedStudents.map(student => 
      `${student.fullName},${student.class},ID: ${student.id},${student.password},bankas.licejus.lt`
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`\nSuccessfully created ${outputPath} with ${processedStudents.length} student accounts`);
    
    const sqlPath = path.resolve(__dirname, 'database_commands.sql');
    fs.writeFileSync(sqlPath, dbInsertCommands.join('\n'));
    
    console.log(`Created ${sqlPath} with SQL commands for manual database update`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(__dirname, `student_accounts_backup_${timestamp}.csv`);
    fs.writeFileSync(backupPath, csvContent);
    console.log(`Created backup at ${backupPath}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .then(() => console.log('Done!'))
  .catch(error => console.error('Unexpected error:', error));