// https://github.com/arshx86
(async () => {
  console.clear();
  console.log("WhatsApp Phone Extractor - Starting extraction...");
  
  const phoneNumbers = new Set();
  const phoneRegex = /\+\d[\d\s-]{7,15}/g;
  
  function scanForPhoneNumbers() {
    const textWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = textWalker.nextNode()) {
      if (!node.nodeValue) continue;
      
      const matches = node.nodeValue.match(phoneRegex);
      if (matches) {
        matches.forEach(match => {
          const cleanNumber = match.replace(/[\s-]/g, '');
          phoneNumbers.add(cleanNumber);
        });
      }
    }
    
    document.querySelectorAll('[title]').forEach(el => {
      if (!el.getAttribute('title')) return;
      
      const matches = el.getAttribute('title').match(phoneRegex);
      if (matches) {
        matches.forEach(match => {
          const cleanNumber = match.replace(/[\s-]/g, '');
          phoneNumbers.add(cleanNumber);
        });
      }
    });
  }
  
  function findScrollableContainer() {
    const containers = [
      document.querySelector('#pane-side'),
      document.querySelector('[role="list"]'),
      document.querySelector('[data-testid="chat-list"]'),
      ...document.querySelectorAll('div[tabindex="0"]')
    ].filter(Boolean);
    
    for (const container of containers) {
      if (container.scrollHeight > container.clientHeight && container.clientHeight > 200) {
        return container;
      }
    }
    
    return document.querySelector('#app') || document.body;
  }
  
  function saveAsTextFile(numbers) {
    const text = numbers.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-numbers-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Numbers saved to text file");
  }
  
  async function scrollAndExtract() {
    const container = findScrollableContainer();
    
    scanForPhoneNumbers();
    console.log(`Initial scan found ${phoneNumbers.size} numbers`);
    
    container.scrollTop = 0;
    await new Promise(r => setTimeout(r, 100));
    
    let lastNumberCount = 0;
    let noNewNumbersCount = 0;
    let scrollAttempts = 0;
    let previousScrollTop = -1;
    let sameScrollPositionCount = 0;
    
    while (true) {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        console.log("Reached the end of contacts");
        break;
      }
      
      if (container.scrollTop === previousScrollTop) {
        sameScrollPositionCount++;
        if (sameScrollPositionCount >= 3) {
          console.log("End reached - no more scrolling possible");
          break;
        }
      } else {
        sameScrollPositionCount = 0;
      }
      previousScrollTop = container.scrollTop;
      
      container.scrollTop += 600;
      scrollAttempts++;
      
      await new Promise(r => setTimeout(r, 100));
      
      scanForPhoneNumbers();
      
      if (phoneNumbers.size > lastNumberCount) {
        if (phoneNumbers.size - lastNumberCount > 5) {
          console.log(`Found ${phoneNumbers.size - lastNumberCount} new numbers (Total: ${phoneNumbers.size})`);
        }
        lastNumberCount = phoneNumbers.size;
        noNewNumbersCount = 0;
      } else {
        noNewNumbersCount++;
        if (noNewNumbersCount >= 8) {
          console.log("End reached - no new numbers found");
          break;
        }
      }
    }
    
    container.scrollTop = 0;
    
    const sortedNumbers = Array.from(phoneNumbers).sort();
    console.log(`\nTotal numbers extracted: ${sortedNumbers.length}`);
    
    saveAsTextFile(sortedNumbers);
    
    return `Extraction complete: ${sortedNumbers.length} phone numbers found and saved to text file`;
  }
  
  return await scrollAndExtract();
})();
