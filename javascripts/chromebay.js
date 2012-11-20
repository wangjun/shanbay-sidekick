var chromebay={
	url:{
		query:function(word){
			return 'http://www.shanbay.com/api/word/'+word;
		},
		examples: function(learningID){
			return 'http://www.shanbay.com/api/learning/examples/'+learningID;
		},
		add: function(word){
			return 'http://www.shanbay.com/api/learning/add/'+word;
		},
		addNote: function(learningID,note){
			return 'http://www.shanbay.com/api/note/add/'+learningID+'?note='+note;
		}
	},
	toggleQueryBtn:function(querying){
		if(querying){
			$('#chromebay-imgQuery').hide('fast',function(){
				$('#chromebay-content').html('<a href="javascript:void(0)" id="chromebay-cancel">取消</a>&nbsp;&nbsp;正在查询中<span id="chrombay-dots1"></span>');
				chromebay.loadingAnimation('chrombay-dots1');
				$('#chromebay-imgQuerying').show();
			});
		}else{
			$('#chromebay-imgQuerying').hide('fast',function(){
				$('#chromebay-imgQuery').show();
			});
		}
	}, 
	clearAnimation: function(){
		if(chromebay.loadingDot){
			window.clearInterval(chromebay.loadingDot);
		}
	},
	loadingAnimation: function(elID,n){
		var num = n||3;
		var dots='';
		chromebay.loadingDot = setInterval(function(){
			var $obj=$('#'+elID);
			if($obj.html()=='...'){
				$obj.html('');
			}
			$obj.html($obj.html()+'.');
		},500);
	},
	addWord:function(word){
		$.ajax({
			url:chromebay.url.add(word),
			complete:function(jqXHR){
				chromebay.clearAnimation();
				var success=true;
				var learningID=0;
				if(jqXHR.responseText==''){
					success=false;
				}else{
					var json=$.parseJSON(jqXHR.responseText);
					learningID=json.id;
					if(learningID==0){
						success=false;
					}
				}
				if(success){
					$('#chromebay-add-status').html('已添加');
					$('#chromebay-pron .tools').prepend('<a href="http://www.shanbay.com/learning/'+learningID+'/" target="_blank">详细</a>');
				}else{
					$('#chromebay-add-status').html('添加失败').animate({},2000).fadeOut('slow',function(){
						$('#chromebay-add').fadeIn('fast');
					});
				}
			}
		});
		
	},
	loadExamples:function(learningID){
		chromebay.loadingAnimation('chrombay-dots2');
		$.get(chromebay.url.examples(learningID),null,function(json){
			if(json.examples_status==1){
				$('#chromebay-examples').html(chromebay.renderExamples(json));
			}else if(json.examples_status==0){
				$('#chromebay-examples').html('该词条暂无例句.');
			}
			chromebay.clearAnimation();
		},'json');
	},
	playMP3: function(audioURL){
		$('#chromebay-audio').attr('src',audioURL);
		$('#chromebay-audio')[0].play();
	},
	renderExamples:function(json){
		var result='';
		for(var i=0;i<json.examples.length;i++){
			result+='<div title="'+(json.examples[i].translation||'暂无翻译')+'">'+
				json.examples[i].first+
				'<span class="entry">'+
				json.examples[i].mid+
				'</span>'+
				json.examples[i].last+
				'</div>';
		}
		return result;
	},
	cache:function(k,v){
		localStorage[k]=v;
		
	},
	render:function(json){
		if(json.voc==""){
			return '<div class="undefined">未找到单词<strong>'+chromebay.word+'</strong>对应的解释。</div>';
		}
		chromebay.cache(json.voc.content,json.voc.definition);
		var html='<div id="chromebay-word" learning_id="'+json.learning_id+'">';
		if(json.learning_id>0){
			html+='<span style="color:#528FC3" title="你已经学过这个单词">'+json.voc.content+'</span>';
		}else{ 
			html+=json.voc.content;
		}
		html+='</div>';
		html+='<div id="chromebay-pron">';
		if(json.voc.pron!=''){
			html+='['+json.voc.pron+']';
		}
		if(json.voc.audio!=''){
			html+='<span class="icon-volume-up" title="发音"></span>';
		}
		html+='<span class="tools">';
		if(json.learning_id>0){
			html+='<a href="http://www.shanbay.com/learning/'+json.learning_id+'" target="_blank">详细</a>';
			html+='<span id="chromebay-add-status">已在词库中</span>';
			
		}else{
			html+='<a href="javascript:void(0)" id="chromebay-add">添加</a>';
			html+='<span id="chromebay-add-status" style="display:none;width:60px;">添加中<span id="chromebay-dots3">.</span></span>';
		}
		
		html+='</div>';
		html+='</div>';
		html+='<div id="chromebay-definition">'+json.voc.definition+'</div>';
		var renderEnDefinitions = function(key){
			var enDef = "<ul>";
			for(var i=0;i<json.voc.en_definitions[key].length;i++){
				enDef+='<li>'+json.voc.en_definitions[key][i]+'</li>';
			}
			enDef+='</ul>';
			return enDef;
		}

		html+='<table id="chromebay-en-definitions" border="0">';
		for(var key in json.voc.en_definitions){
			html+='<tr>'+
			'<td valign="top" align="left" width="10px"><ul style="list-style-type:none;margin-right:2px;"><li>'+key+'</li></ul></td>'+
			'<td valign="top" align="left">'+renderEnDefinitions(key)+'</td>'+
			'</tr>';
		}
		html+='</table>';
		if(json.learning_id>0){
			html+='<div id="chromebay-examples">正在加载例句<span id="chrombay-dots2"></span></div>'
		}
		return html;
	},
	query:function(){
		chromebay.word = $('input[name="word"]').val();
		if($.trim(chromebay.word)!=""){
			chromebay.toggleQueryBtn(true);
			chromebay.jqXHR=$.ajax({
				url:chromebay.url.query(chromebay.word),
				complete: function(jqXHR, textStatus){
					try{
						var json=$.parseJSON(jqXHR.responseText);
						$('#chromebay-content').html(chromebay.render(json));

						$('.icon-volume-up').click(function(){
							chromebay.playMP3(json.voc.audio);
						});

						$('#chromebay-add').click(function(){
							$(this).fadeOut('fast',function(){
								$('#chromebay-add-status').fadeIn('fast',function(){
									chromebay.loadingAnimation('chromebay-dots3');
									chromebay.addWord(json.voc.content);
								});
							});
						});
						chromebay.toggleQueryBtn(false);
						$('input[name="word"]').val('');
						chromebay.clearAnimation();
						if(json.learning_id>0){
							chromebay.loadExamples(json.learning_id);
						}
					}catch(e){
						if(chromebay.jqXHRCanceled){
							chromebay.jqXHRCanceled=false;
							return;
						}
						$('#chromebay-main').hide('fast',function(){
							$('#chromebay-loginLink').show();
						});
						chromebay.clearAnimation();
					}
				},
				dataType:'html json'
			})
		}
	}
}
